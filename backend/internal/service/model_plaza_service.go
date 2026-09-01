package service

import (
	"context"
	"fmt"
	"sort"
	"strings"
)

// PlazaOfficialPricing 模型广场展示用的官方参考价（USD per token），与计费同源：
// LiteLLM → 内置兜底价卡 → 模型策略。字段为 nil 表示该项缺失（0 视为未配置）。
type PlazaOfficialPricing struct {
	InputPrice        *float64
	OutputPrice       *float64
	CacheWritePrice   *float64 // 5m 缓存写入（= LiteLLM cache_creation）
	CacheWrite1hPrice *float64 // 1h 缓存写入，仅计费会区分 5m/1h 时给出
	CacheReadPrice    *float64
	// Intervals 官方长上下文阶梯（多档时给出），不受分组开关影响。
	Intervals []PricingInterval
}

// PlazaModel 模型广场中单个模型条目：按实收口径合成的展示定价 + 官方参考价。
type PlazaModel struct {
	Name            string
	Platform        string
	Pricing         *ChannelModelPricing
	OfficialPricing *PlazaOfficialPricing
	// LongContextBasis 多档时的计价基准（整单 / 仅超出部分），单档为空。
	LongContextBasis ContextPricingBasis
	// TimePricing 计费会生效的分时倍率时段；无分时为 nil。
	TimePricing *TimePricingSchedule
}

// PlazaChannel 是模型广场「号池/渠道视角」展示用的渠道摘要。
type PlazaChannel struct {
	ID          int64
	Name        string
	Description string
	Platform    string
	ModelCount  int
}

// PlazaGroup 模型广场中以分组为顶层的条目。
//
// 与 AvailableGroupRef 相比多了 Description 与 Models；Models 来自该分组关联渠道的
// 支持模型（普通分组按分组平台隔离，Composite 分组展开关联渠道已配置的
// 具体平台），与「可用渠道」页口径一致。
type PlazaGroup struct {
	ID                 int64
	Name               string
	Description        string
	Platform           string
	SubscriptionType   string
	RateMultiplier     float64
	PeakRateEnabled    bool
	PeakStart          string
	PeakEnd            string
	PeakRateMultiplier float64
	IsExclusive        bool
	// 图片按次实付倍率：ImageRateIndependent 为 true 时，图片计费模型的实付
	// = 档位价 × ImageRateMultiplier，不乘分组/用户专属倍率（与计费口径一致）。
	ImageRateIndependent bool
	ImageRateMultiplier  float64
	// LongContextPricingEnabled 分组是否按上下文长度应用阶梯价；关闭时模型展示的是最低档。
	LongContextPricingEnabled bool
	Channels                  []PlazaChannel
	Models                    []PlazaModel
}

// ModelPlazaAccountRepository 是模型广场读取上游账号同步模型所需的最小仓库接口。
type ModelPlazaAccountRepository interface {
	ListByGroup(ctx context.Context, groupID int64) ([]Account, error)
}

// ModelPlazaService 聚合模型广场数据。
//
// 线上模型枚举来自分组内上游账号已同步的 model_mapping；token 模型的展示单价与
// 阶梯由 BillingService 的阶梯表查询给出（与扣费走同一条解析链与计费函数），
// 图片/按次模型沿用渠道/分组档位价，并在缺价时回落全局价卡。
type ModelPlazaService struct {
	channelRepo    ChannelRepository
	groupRepo      GroupRepository
	accountRepo    ModelPlazaAccountRepository
	pricingService *PricingService
	billingService *BillingService
	resolver       *ModelPricingResolver
}

// NewModelPlazaService 创建模型广场服务。
func NewModelPlazaService(
	channelRepo ChannelRepository,
	groupRepo GroupRepository,
	accountRepo ModelPlazaAccountRepository,
	pricingService *PricingService,
	billingService *BillingService,
	resolver *ModelPricingResolver,
) *ModelPlazaService {
	return &ModelPlazaService{
		channelRepo:    channelRepo,
		groupRepo:      groupRepo,
		accountRepo:    accountRepo,
		pricingService: pricingService,
		billingService: billingService,
		resolver:       resolver,
	}
}

// ListGroups 返回模型广场数据：每个活跃分组附带其可用模型与定价。
//
// 模型枚举口径：优先使用分组内活跃上游账号已同步的 model_mapping；
// 测试/兼容场景未注入账号仓库时回落 Active 渠道的 SupportedModels。
//   - 渠道按 lower(name) 排序后遍历，保证同名模型去重结果确定；
//   - 同分组同名模型「先见者胜」，仅当已存条目无定价而新条目有定价时升级替换；
//   - token 模型的单价与阶梯按实收口径合成（见 ResolveContextPricingSchedule），
//     图片计费模型的档位价按实收口径合成（见 plazaImageDisplayPricing）；
//   - 每个模型附带官方参考价（查不到为 nil）；
//   - 只返回 Models 非空的分组；分组按 RateMultiplier 升序（同倍率按名称），
//     组内模型按名称排序。
//
// 可见性过滤（专属分组）不在此层做，由 handler 按登录态裁剪。
func (s *ModelPlazaService) ListGroups(ctx context.Context) ([]PlazaGroup, error) {
	channels, err := s.channelRepo.ListAll(ctx)
	if err != nil {
		return nil, fmt.Errorf("list channels: %w", err)
	}
	groups, err := s.groupRepo.ListActive(ctx)
	if err != nil {
		return nil, fmt.Errorf("list active groups: %w", err)
	}

	sort.SliceStable(channels, func(i, j int) bool {
		return strings.ToLower(channels[i].Name) < strings.ToLower(channels[j].Name)
	})

	byGroup := make(map[int64]*PlazaGroup, len(groups))
	groupEnt := make(map[int64]*Group, len(groups))
	order := make([]int64, 0, len(groups))
	for i := range groups {
		g := &groups[i]
		byGroup[g.ID] = &PlazaGroup{
			ID:                        g.ID,
			Name:                      g.Name,
			Description:               g.Description,
			Platform:                  g.Platform,
			SubscriptionType:          g.SubscriptionType,
			RateMultiplier:            g.RateMultiplier,
			PeakRateEnabled:           g.PeakRateEnabled,
			PeakStart:                 g.PeakStart,
			PeakEnd:                   g.PeakEnd,
			PeakRateMultiplier:        g.PeakRateMultiplier,
			IsExclusive:               g.IsExclusive,
			ImageRateIndependent:      g.ImageRateIndependent,
			ImageRateMultiplier:       g.ImageRateMultiplier,
			LongContextPricingEnabled: g.LongContextPricingEnabled,
		}
		groupEnt[g.ID] = g
		order = append(order, g.ID)
	}

	type modelKey struct {
		platform string
		name     string
	}
	addModel := func(pg *PlazaGroup, idx map[modelKey]int, m SupportedModel) {
		key := modelKey{platform: strings.ToLower(strings.TrimSpace(m.Platform)), name: strings.ToLower(strings.TrimSpace(m.Name))}
		if key.name == "" || key.name == "*" || strings.HasSuffix(key.name, "*") {
			return
		}
		if at, seen := idx[key]; seen {
			// 先见者胜；仅当已存条目无定价而新条目有定价时升级。
			if pricingNeedsFallback(pg.Models[at].Pricing) && !pricingNeedsFallback(m.Pricing) {
				pg.Models[at].Pricing = m.Pricing
			}
			return
		}
		idx[key] = len(pg.Models)
		pg.Models = append(pg.Models, PlazaModel{
			Name:     strings.TrimSpace(m.Name),
			Platform: strings.TrimSpace(m.Platform),
			Pricing:  m.Pricing,
		})
	}

	// modelIdx[groupID][platform+modelName] = index into byGroup[groupID].Models
	modelIdx := make(map[int64]map[modelKey]int, len(groups))
	channelSeen := make(map[int64]map[int64]struct{}, len(groups))
	for i := range channels {
		ch := &channels[i]
		if ch.Status != StatusActive {
			continue
		}
		ch.normalizeBillingModelSource()
		supported := ch.SupportedModels()

		for _, gid := range ch.GroupIDs {
			pg, ok := byGroup[gid]
			if !ok {
				continue
			}
			count := 0
			idx := modelIdx[gid]
			if idx == nil {
				idx = make(map[modelKey]int, len(supported))
				modelIdx[gid] = idx
			}
			if s.accountRepo == nil {
				for j := range supported {
					m := supported[j]
					if pg.Platform == PlatformComposite {
						if !isConcreteRequestPlatform(m.Platform) {
							continue
						}
					} else if m.Platform != pg.Platform {
						continue
					}
					count++
					addModel(pg, idx, m)
				}
			}
			if s.accountRepo != nil || count > 0 {
				seen := channelSeen[gid]
				if seen == nil {
					seen = make(map[int64]struct{})
					channelSeen[gid] = seen
				}
				if _, ok := seen[ch.ID]; !ok {
					seen[ch.ID] = struct{}{}
					pg.Channels = append(pg.Channels, PlazaChannel{
						ID:          ch.ID,
						Name:        ch.Name,
						Description: ch.Description,
						Platform:    chPlatformForPlaza(ch, pg.Platform),
						ModelCount:  count,
					})
				}
			}
		}
	}

	if s.accountRepo != nil {
		for _, gid := range order {
			pg := byGroup[gid]
			g := groupEnt[gid]
			accounts, err := s.accountRepo.ListByGroup(ctx, gid)
			if err != nil {
				return nil, fmt.Errorf("list accounts by group %d: %w", gid, err)
			}
			idx := modelIdx[gid]
			if idx == nil {
				idx = make(map[modelKey]int)
				modelIdx[gid] = idx
			}
			for _, m := range accountSyncedSupportedModels(accounts, pg.Platform) {
				if pricingNeedsFallback(m.Pricing) {
					m.Pricing = s.lookupConfiguredDisplayPricing(ctx, g, m.Platform, m.Name)
				}
				addModel(pg, idx, m)
			}
		}
	}

	officialMemo := make(map[string]*PlazaOfficialPricing)
	out := make([]PlazaGroup, 0, len(order))
	for _, gid := range order {
		pg := byGroup[gid]
		if len(pg.Models) == 0 {
			continue
		}
		sort.SliceStable(pg.Models, func(i, j int) bool {
			if pg.Models[i].Name != pg.Models[j].Name {
				return pg.Models[i].Name < pg.Models[j].Name
			}
			return pg.Models[i].Platform < pg.Models[j].Platform
		})
		sort.SliceStable(pg.Channels, func(i, j int) bool {
			return strings.ToLower(pg.Channels[i].Name) < strings.ToLower(pg.Channels[j].Name)
		})
		for i := range pg.Channels {
			pg.Channels[i].ModelCount = len(pg.Models)
		}
		g := groupEnt[gid]
		for j := range pg.Models {
			s.fillDisplayPricing(ctx, &pg.Models[j], g)
			pg.Models[j].OfficialPricing = s.lookupOfficialPricing(ctx, pg.Models[j].Name, officialMemo)
		}
		out = append(out, *pg)
	}

	sort.SliceStable(out, func(i, j int) bool {
		if out[i].RateMultiplier != out[j].RateMultiplier {
			return out[i].RateMultiplier < out[j].RateMultiplier
		}
		return out[i].Name < out[j].Name
	})
	return out, nil
}

func chPlatformForPlaza(ch *Channel, groupPlatform string) string {
	if groupPlatform != PlatformComposite {
		return groupPlatform
	}
	platforms := make([]string, 0, len(ch.ModelPricing))
	seen := make(map[string]struct{}, len(ch.ModelPricing))
	for _, p := range ch.ModelPricing {
		if p.Platform == "" {
			continue
		}
		if _, ok := seen[p.Platform]; ok {
			continue
		}
		seen[p.Platform] = struct{}{}
		platforms = append(platforms, p.Platform)
	}
	if len(platforms) == 1 {
		return platforms[0]
	}
	return groupPlatform
}

func accountSyncedSupportedModels(accounts []Account, groupPlatform string) []SupportedModel {
	type key struct {
		platform string
		model    string
	}
	seen := make(map[key]SupportedModel)
	for i := range accounts {
		acc := &accounts[i]
		if !acc.IsActive() {
			continue
		}
		platform := strings.TrimSpace(acc.Platform)
		if groupPlatform == PlatformComposite {
			if !isConcreteRequestPlatform(platform) {
				continue
			}
		} else if platform != groupPlatform {
			continue
		}
		for model := range explicitAccountModelMapping(acc) {
			model = strings.TrimSpace(model)
			normalized := strings.ToLower(model)
			if model == "" || normalized == "*" || strings.HasSuffix(normalized, "*") {
				continue
			}
			k := key{platform: strings.ToLower(platform), model: normalized}
			if _, ok := seen[k]; ok {
				continue
			}
			seen[k] = SupportedModel{Name: model, Platform: platform}
		}
	}
	out := make([]SupportedModel, 0, len(seen))
	for _, m := range seen {
		out = append(out, m)
	}
	sort.SliceStable(out, func(i, j int) bool {
		if out[i].Name != out[j].Name {
			return out[i].Name < out[j].Name
		}
		return out[i].Platform < out[j].Platform
	})
	return out
}

func explicitAccountModelMapping(a *Account) map[string]string {
	if a == nil || a.Credentials == nil {
		return nil
	}
	raw, ok := a.Credentials["model_mapping"]
	if !ok || raw == nil {
		return nil
	}
	out := make(map[string]string)
	switch mapping := raw.(type) {
	case map[string]any:
		for k, v := range mapping {
			key := strings.TrimSpace(k)
			if key == "" {
				continue
			}
			if s, ok := v.(string); ok {
				out[key] = strings.TrimSpace(s)
			}
		}
	case map[string]string:
		for k, v := range mapping {
			key := strings.TrimSpace(k)
			if key == "" {
				continue
			}
			out[key] = strings.TrimSpace(v)
		}
	}
	if len(out) == 0 {
		return nil
	}
	return out
}

// fillDisplayPricing 把模型的展示定价换成实收口径：
// token 模型取计费阶梯表（单价与档位均由真实计费函数得出），
// 图片/按次模型（或阶梯表不可用时）沿用渠道定价与分组图片档位价。
func (s *ModelPlazaService) fillDisplayPricing(ctx context.Context, m *PlazaModel, g *Group) {
	if m == nil {
		return
	}
	if pricingNeedsFallback(m.Pricing) {
		m.Pricing = s.lookupConfiguredDisplayPricing(ctx, g, m.Platform, m.Name)
	}
	if pricingNeedsFallback(m.Pricing) && s.pricingService != nil {
		m.Pricing = synthesizePricingFromLiteLLM(s.pricingService.GetModelPricing(m.Name), m.Pricing)
	}
	if m.Pricing != nil && (m.Pricing.BillingMode == BillingModeImage ||
		m.Pricing.BillingMode == BillingModePerRequest ||
		m.Pricing.BillingMode == BillingModeVideo) {
		m.Pricing = plazaImageDisplayPricing(m.Pricing, g)
		return
	}
	if s.billingService != nil && s.resolver != nil {
		sched, err := s.billingService.ResolveContextPricingSchedule(ctx, s.resolver, ContextPricingScheduleInput{
			Model:    m.Name,
			Group:    g,
			Platform: m.Platform,
		})
		if err == nil && sched != nil && len(sched.Tiers) > 0 {
			m.Pricing = plazaPricingFromSchedule(m.Pricing, sched)
			if len(sched.Tiers) > 1 {
				m.LongContextBasis = sched.Basis
			}
			m.TimePricing = sched.TimePricing
			return
		}
	}
	m.Pricing = plazaImageDisplayPricing(m.Pricing, g)
}

func (s *ModelPlazaService) lookupConfiguredDisplayPricing(ctx context.Context, g *Group, platform, model string) *ChannelModelPricing {
	if g != nil {
		if gp := matchGroupModelPricing(g, model); gp != nil {
			if gp.Platform == "" || platform == "" || gp.Platform == platform {
				return gp
			}
		}
	}
	if s.resolver == nil || g == nil {
		return nil
	}
	if platform != "" {
		ctx = WithResolvedTargetPlatform(ctx, platform)
	}
	cp := s.resolver.lookupChannelPricingNormalized(ctx, g.ID, model)
	if cp == nil {
		return nil
	}
	if cp.Platform != "" && platform != "" && cp.Platform != platform {
		return nil
	}
	return cp
}

func groupHasExplicitDisplayPricing(g *Group, platform, model string) bool {
	p := matchGroupModelPricing(g, model)
	if p == nil {
		return false
	}
	if p.Platform != "" && platform != "" && p.Platform != platform {
		return false
	}
	return !pricingNeedsFallback(p)
}

// plazaPricingFromSchedule 把阶梯表压成展示用的 ChannelModelPricing：
// 平价取首档单价，多档时 Intervals 逐档给出绝对单价；图片/按次字段沿用原始定价。
func plazaPricingFromSchedule(raw *ChannelModelPricing, sched *ContextPricingSchedule) *ChannelModelPricing {
	out := &ChannelModelPricing{BillingMode: BillingModeToken}
	if raw != nil {
		out.ImageInputPrice = raw.ImageInputPrice
		out.ImageOutputPrice = raw.ImageOutputPrice
		out.PerRequestPrice = raw.PerRequestPrice
	}
	first := sched.Tiers[0]
	out.InputPrice = first.Input
	out.OutputPrice = first.Output
	out.CacheWritePrice = first.CacheWrite
	out.CacheReadPrice = first.CacheRead
	if len(sched.Tiers) > 1 {
		out.Intervals = plazaIntervalsFromTiers(sched.Tiers)
	}
	return out
}

func plazaIntervalsFromTiers(tiers []ContextPricingTier) []PricingInterval {
	intervals := make([]PricingInterval, 0, len(tiers))
	for i, t := range tiers {
		intervals = append(intervals, PricingInterval{
			MinTokens:       t.MinTokens,
			MaxTokens:       t.MaxTokens,
			TierLabel:       t.Label,
			InputPrice:      t.Input,
			OutputPrice:     t.Output,
			CacheWritePrice: t.CacheWrite,
			CacheReadPrice:  t.CacheRead,
			SortOrder:       i,
		})
	}
	return intervals
}

// plazaImageDisplayPricing 为图片计费模型合成展示定价，使档位价与实收口径一致：
// 每档（1K/2K/4K）单价 = 分组图片价 > 渠道同档位价 > 渠道默认按次价，无价的档不展示。
// 分组未配任何图片价、或定价非图片模式时原样返回。返回克隆，不修改入参
// （渠道定价指针指向缓存共享数据）。
func plazaImageDisplayPricing(p *ChannelModelPricing, g *Group) *ChannelModelPricing {
	if p == nil || g == nil || p.BillingMode != BillingModeImage {
		return p
	}
	if g.ImagePrice1K == nil && g.ImagePrice2K == nil && g.ImagePrice4K == nil {
		return p
	}
	channelTierPrice := func(label string) *float64 {
		for i := range p.Intervals {
			if p.Intervals[i].TierLabel == label && p.Intervals[i].PerRequestPrice != nil {
				return p.Intervals[i].PerRequestPrice
			}
		}
		return p.PerRequestPrice
	}
	tiers := []struct {
		label      string
		groupPrice *float64
	}{
		{"1K", g.ImagePrice1K},
		{"2K", g.ImagePrice2K},
		{"4K", g.ImagePrice4K},
	}
	clone := *p
	clone.Intervals = make([]PricingInterval, 0, len(tiers))
	for i, t := range tiers {
		price := t.groupPrice
		if price == nil {
			price = channelTierPrice(t.label)
		}
		if price == nil {
			continue
		}
		v := *price
		clone.Intervals = append(clone.Intervals, PricingInterval{
			TierLabel:       t.label,
			PerRequestPrice: &v,
			SortOrder:       i,
		})
	}
	return &clone
}

// lookupOfficialPricing 查询模型的官方参考价（与计费同源：LiteLLM → 内置兜底 → 模型策略），
// 带 memo 避免同名模型重复解析。官方阶梯按无分组、无渠道的口径查阶梯表。
// billingService 为 nil（测试场景）或查不到时返回 nil。
func (s *ModelPlazaService) lookupOfficialPricing(ctx context.Context, modelName string, memo map[string]*PlazaOfficialPricing) *PlazaOfficialPricing {
	if s.billingService == nil {
		return nil
	}
	if cached, ok := memo[modelName]; ok {
		return cached
	}
	var result *PlazaOfficialPricing
	if mp, err := s.billingService.GetModelPricing(modelName); err == nil && mp != nil {
		result = &PlazaOfficialPricing{
			InputPrice:      nonZeroPtr(mp.InputPricePerToken),
			OutputPrice:     nonZeroPtr(mp.OutputPricePerToken),
			CacheWritePrice: nonZeroPtr(mp.CacheCreationPricePerToken),
			CacheReadPrice:  nonZeroPtr(mp.CacheReadPricePerToken),
		}
		// 计费只在支持 5m/1h 分档时使用 1h 价，其余情况 1h 价对用户无意义。
		if mp.SupportsCacheBreakdown {
			result.CacheWrite1hPrice = nonZeroPtr(mp.CacheCreation1hPrice)
		}
		if s.resolver != nil {
			sched, schedErr := s.billingService.ResolveContextPricingSchedule(ctx, s.resolver, ContextPricingScheduleInput{Model: modelName})
			if schedErr == nil && sched != nil && len(sched.Tiers) > 1 {
				result.Intervals = plazaIntervalsFromTiers(sched.Tiers)
			}
		}
		if result.InputPrice == nil && result.OutputPrice == nil && result.CacheWritePrice == nil &&
			result.CacheWrite1hPrice == nil && result.CacheReadPrice == nil && len(result.Intervals) == 0 {
			result = nil
		}
	}
	memo[modelName] = result
	return result
}
