<template>
  <AppLayout>
    <div class="mx-auto max-w-7xl space-y-6">
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
      <template v-else>
        <!-- Payment in progress (shared by recharge and subscription) -->
        <template v-if="paymentPhase === 'paying'">
          <PaymentStatusPanel
            :order-id="paymentState.orderId"
            :amount="paymentState.amount"
            :pay-amount="paymentState.payAmount"
            :qr-code="paymentState.qrCode"
            :expires-at="paymentState.expiresAt"
            :payment-type="paymentState.paymentType"
            :pay-url="paymentState.payUrl"
            :order-type="paymentState.orderType"
            :currency="paymentState.currency || selectedCurrency"
            :out-trade-no="paymentState.outTradeNo"
            :mobile-alipay-deep-link="paymentState.alipayMobilePrecreateDeepLink"
            @done="onPaymentDone"
            @success="onPaymentSuccess"
            @settled="onPaymentSettled"
          />
        </template>
        <!-- Unified wallet content (select phase) -->
        <template v-else>
          <!-- Subscription confirm (inline, replaces unified content) -->
          <template v-if="selectedPlan">
              <div class="card p-5">
                <!-- Header: platform badge + plan name -->
                <div class="mb-3 flex flex-wrap items-center gap-2">
                  <span :class="['rounded-md border px-2 py-0.5 text-xs font-medium', planBadgeClass]">
                    {{ platformLabel(selectedPlan.group_platform || '') }}
                  </span>
                  <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ selectedPlan.name }}</h3>
                </div>
                <!-- Price -->
                <div class="flex items-baseline gap-2">
                  <span v-if="selectedPlan.original_price" class="text-sm text-gray-400 line-through dark:text-gray-500">
                    {{ formatSelectedSubscriptionPaymentAmount(selectedPlan.original_price) }}
                  </span>
                  <span :class="['text-3xl font-bold', planTextClass]">{{ formatSelectedSubscriptionPaymentAmount(selectedPlan.price) }}</span>
                  <span class="text-sm text-gray-500 dark:text-gray-400">/ {{ planValiditySuffix }}</span>
                </div>
                <!-- Description -->
                <p v-if="selectedPlan.description" class="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {{ selectedPlan.description }}
                </p>
                <!-- Rate + Limits grid -->
                <div class="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <span class="text-xs text-gray-400 dark:text-gray-500">{{ t('payment.planCard.rate') }}</span>
                    <div class="flex items-baseline">
                      <span :class="['text-lg font-bold', planTextClass]">×{{ selectedPlan.rate_multiplier ?? 1 }}</span>
                    </div>
                  </div>
                  <div v-if="planHasPeakRate(selectedPlan)">
                    <span class="text-xs text-gray-400 dark:text-gray-500">{{ t('payment.planCard.peakRate') }}</span>
                    <div class="text-sm font-semibold text-amber-700 dark:text-amber-300">
                      {{ planPeakRateLabel(selectedPlan) }}
                    </div>
                  </div>
                  <div v-if="selectedPlan.daily_limit_usd != null">
                    <span class="text-xs text-gray-400 dark:text-gray-500">{{ t('payment.planCard.dailyLimit') }}</span>
                    <div class="text-lg font-semibold text-gray-800 dark:text-gray-200">${{ selectedPlan.daily_limit_usd }}</div>
                  </div>
                  <div v-if="selectedPlan.weekly_limit_usd != null">
                    <span class="text-xs text-gray-400 dark:text-gray-500">{{ t('payment.planCard.weeklyLimit') }}</span>
                    <div class="text-lg font-semibold text-gray-800 dark:text-gray-200">${{ selectedPlan.weekly_limit_usd }}</div>
                  </div>
                  <div v-if="selectedPlan.monthly_limit_usd != null">
                    <span class="text-xs text-gray-400 dark:text-gray-500">{{ t('payment.planCard.monthlyLimit') }}</span>
                    <div class="text-lg font-semibold text-gray-800 dark:text-gray-200">${{ selectedPlan.monthly_limit_usd }}</div>
                  </div>
                  <div v-if="selectedPlan.daily_limit_usd == null && selectedPlan.weekly_limit_usd == null && selectedPlan.monthly_limit_usd == null">
                    <span class="text-xs text-gray-400 dark:text-gray-500">{{ t('payment.planCard.quota') }}</span>
                    <div class="text-lg font-semibold text-gray-800 dark:text-gray-200">{{ t('payment.planCard.unlimited') }}</div>
                  </div>
                </div>
              </div>
              <div v-if="enabledMethods.length >= 1" class="card p-6">
                <PaymentMethodSelector
                  :methods="subMethodOptions"
                  :selected="selectedMethod"
                  @select="selectedMethod = $event"
                />
              </div>
              <div v-if="feeRate > 0 && selectedPlan.price > 0" class="card p-6">
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-500 dark:text-gray-400">{{ t('payment.amountLabel') }}</span>
                    <span class="text-gray-900 dark:text-white">{{ formatSelectedPaymentAmount(subPaymentAmount) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500 dark:text-gray-400">{{ t('payment.fee') }} ({{ feeRate }}%)</span>
                    <span class="text-gray-900 dark:text-white">{{ formatSelectedPaymentAmount(subFeeAmount) }}</span>
                  </div>
                  <div class="flex justify-between border-t border-gray-200 pt-2 dark:border-dark-600">
                    <span class="font-medium text-gray-700 dark:text-gray-300">{{ t('payment.actualPay') }}</span>
                    <span class="text-lg font-bold text-primary-600 dark:text-primary-400">{{ formatSelectedPaymentAmount(subTotalAmount) }}</span>
                  </div>
                </div>
              </div>
              <button :class="['btn w-full py-3 text-base font-medium', paymentButtonClass]" :disabled="!canSubmitSubscription || submitting" @click="confirmSubscribe">
                <span v-if="submitting" class="flex items-center justify-center gap-2">
                  <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  {{ t('common.processing') }}
                </span>
                <span v-else>{{ t('payment.createOrder') }} {{ formatSelectedPaymentAmount(subTotalAmount) }}</span>
              </button>
              <button class="btn btn-secondary w-full" @click="selectedPlan = null">{{ t('common.cancel') }}</button>
          </template>
          <template v-else>
            <section v-if="!checkout.balance_disabled" class="space-y-4">
              <div class="flex flex-col gap-2">
                <div>
                  <p class="text-[11px] font-semibold uppercase text-primary-700 dark:text-primary-300">User console</p>
                  <h2 class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">充值</h2>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">付款完成后获取一次性余额兑换码，返回本页兑换即可到账。</p>
                </div>
              </div>

              <div class="grid gap-4 xl:grid-cols-4">
                <div v-if="balanceMethodOptions.length > 0" class="card flex min-h-[260px] flex-col p-5">
                  <span class="w-fit rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">Alipay checkout</span>
                  <h3 class="mt-4 text-2xl font-bold text-gray-900 dark:text-white">支付宝支付</h3>
                  <p class="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">输入充值金额后发起支付宝订单，支付完成后余额会自动到账。</p>

                  <div class="mt-4">
                    <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">充值金额</label>
                    <input
                      v-model.number="amount"
                      type="number"
                      min="1"
                      step="0.01"
                      class="input w-full"
                      placeholder="请输入充值金额"
                    />
                  </div>

                  <div class="mt-4 flex-1">
                    <PaymentMethodSelector
                      :methods="balanceMethodOptions"
                      :selected="selectedMethod"
                      @select="selectedMethod = $event"
                    />
                  </div>

                  <div class="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-dark-700 dark:bg-dark-900">
                    <p class="text-xs text-gray-500 dark:text-gray-400">实际支付</p>
                    <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{{ formatSelectedPaymentAmount(validAmount) }}</p>
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">支付宝</p>
                  </div>

                  <button
                    class="btn btn-primary mt-4 w-full"
                    :class="paymentButtonClass"
                    :disabled="!canSubmitBalance || submitting"
                    @click="confirmRecharge"
                  >
                    <span v-if="submitting" class="flex items-center justify-center gap-2">
                      <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      {{ t('common.processing') }}
                    </span>
                    <span v-else>{{ t('payment.createOrder') }} {{ formatSelectedPaymentAmount(validAmount) }}</span>
                  </button>
                </div>

                <div class="card flex min-h-[260px] flex-col p-5">
                  <span class="w-fit rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">Manual service</span>
                  <h3 class="mt-4 text-2xl font-bold text-gray-900 dark:text-white">人工充值</h3>
                  <p class="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">人工服务时间上午8点-晚上12点。请联系管理员说明充值金额，确认到账后再兑换。</p>
                  <div class="my-5 flex flex-1 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-center dark:border-dark-700 dark:bg-dark-900">
                    <div><p class="text-3xl font-bold text-primary-600 dark:text-primary-400">人工</p><p class="mt-2 text-xs text-gray-500 dark:text-gray-400">服务时间 8:00-24:00</p></div>
                  </div>
                  <button class="btn btn-primary w-full" @click="showContactGroupModal = true">联系管理员</button>
                </div>

                <div class="card flex min-h-[260px] flex-col p-5">
                  <span class="w-fit rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">Catfk checkout</span>
                  <h3 class="mt-4 text-2xl font-bold text-gray-900 dark:text-white">云猫寄售</h3>
                  <p class="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">付款完成后在云猫订单页面获取一次性余额兑换码，返回本页兑换即可到账。</p>
                  <div class="my-5 flex flex-1 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-center dark:border-dark-700 dark:bg-dark-900">
                    <div><p class="text-3xl font-bold text-emerald-700 dark:text-emerald-300">云猫寄售</p><p class="mt-2 text-xs text-gray-500 dark:text-gray-400">自助付款，自动发放兑换码</p></div>
                  </div>
                  <a class="btn btn-primary w-full text-center" :href="yunmaoRechargeUrl" target="_blank" rel="noopener noreferrer">前往云猫付款</a>
                </div>

                <div v-if="checkout.help_image_url || checkout.help_text" class="card flex min-h-[260px] flex-col p-5">
                  <span class="w-fit rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">Help</span>
                  <h3 class="mt-4 text-xl font-bold text-gray-900 dark:text-white">付款说明</h3>
                  <img v-if="checkout.help_image_url" :src="checkout.help_image_url" alt="" class="my-4 h-32 w-full cursor-pointer rounded-xl object-contain" @click="previewImage = checkout.help_image_url" />
                  <p v-if="checkout.help_text" class="text-sm leading-6 text-gray-500 dark:text-gray-400">{{ checkout.help_text }}</p>
                </div>

                <div class="card flex min-h-[260px] flex-col p-5">
                  <div class="rounded-xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-900/20">
                    <p class="text-xs text-gray-500 dark:text-gray-400">当前余额</p>
                    <p class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">${{ user?.balance?.toFixed(2) || '0.00' }}</p>
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">USD</p>
                  </div>
                  <p class="mt-5 text-[11px] font-semibold uppercase text-primary-700 dark:text-primary-300">Redeem balance</p>
                  <h3 class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">兑换余额</h3>
                  <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">输入一次性余额兑换码，成功后余额会立即更新。</p>
                  <form class="mt-4 flex flex-col gap-2 sm:flex-row" @submit.prevent="handleCompactRedeem">
                    <input v-model="redeemCode" class="input min-w-0 flex-1" :disabled="redeemSubmitting" :placeholder="t('redeem.redeemCodePlaceholder')" />
                    <button class="btn btn-primary shrink-0" type="submit" :disabled="!redeemCode.trim() || redeemSubmitting">{{ redeemSubmitting ? '处理中' : '立即兑换' }}</button>
                  </form>
                  <p v-if="redeemResult" class="mt-3 text-xs text-emerald-600 dark:text-emerald-400">{{ redeemResult.message }}</p>
                  <p v-if="redeemError" class="mt-3 text-xs text-red-600 dark:text-red-400">{{ redeemError }}</p>
                  <p class="mt-auto pt-4 text-xs text-gray-500 dark:text-gray-400">● 兑换码只能使用一次，请勿将兑换码转发给他人。</p>
                </div>
              </div>
            </section>

            <section v-if="showAffiliateSection" class="card p-5">
              <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div class="min-w-0">
                  <p class="text-[11px] font-semibold uppercase text-primary-700 dark:text-primary-300">Invite & earn</p>
                  <h2 class="mt-1 text-xl font-bold text-gray-900 dark:text-white">{{ affiliateRuleTitle }}</h2>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ affiliateRuleDescription }}</p>
                </div>
                <div v-if="affiliateDetail" class="min-w-0 flex-1 lg:max-w-2xl">
                  <div class="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div class="rounded-lg border border-gray-200 bg-white px-2 py-2 dark:border-dark-700 dark:bg-dark-900/60">
                      <p class="text-gray-500 dark:text-gray-400">邀请人数</p>
                      <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{{ affiliateDetail.aff_count.toLocaleString() }}</p>
                    </div>
                    <div class="rounded-lg border border-gray-200 bg-white px-2 py-2 dark:border-dark-700 dark:bg-dark-900/60">
                      <p class="text-gray-500 dark:text-gray-400">累计获得</p>
                      <p class="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">{{ formatCurrency(affiliateDetail.aff_history_quota) }}</p>
                    </div>
                    <div class="rounded-lg border border-gray-200 bg-white px-2 py-2 dark:border-dark-700 dark:bg-dark-900/60">
                      <p class="text-gray-500 dark:text-gray-400">我的返利比例</p>
                      <p class="mt-1 text-sm font-semibold text-primary-700 dark:text-primary-300">{{ formattedAffiliateRebateRate }}%</p>
                    </div>
                  </div>
                  <div class="mb-2 flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>你的专属邀请码</span>
                    <strong class="text-sm text-gray-900 dark:text-white">{{ affiliateDetail.aff_code }}</strong>
                  </div>
                  <div class="flex flex-col gap-2 sm:flex-row">
                    <input class="input min-w-0 flex-1 bg-primary-50 text-sm dark:bg-primary-900/20" readonly :value="inviteLink" />
                    <button class="btn btn-primary shrink-0" @click="copyInviteLink">复制邀请链接</button>
                  </div>
                </div>
                <div v-else class="text-sm text-gray-400">加载邀请信息...</div>
                <button
                  v-if="affiliateDetail && affiliateDetail.aff_quota > 0"
                  class="btn btn-secondary shrink-0"
                  :disabled="affiliateTransferring"
                  @click="transferAffiliateQuota"
                >
                  {{ affiliateTransferring ? '处理中' : `转入余额 ${formatCurrency(affiliateDetail.aff_quota)}` }}
                </button>
              </div>
            </section>
          </template>
        </template>
      </template>
    </div>
    <!-- Renewal Plan Selection Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showRenewalModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="closeRenewalModal">
          <div class="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-dark-700 dark:bg-dark-900">
            <!-- Close button -->
            <button class="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-dark-700 dark:hover:text-gray-200" @click="closeRenewalModal">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{{ t('payment.selectPlan') }}</h3>
            <div class="space-y-4">
              <SubscriptionPlanCard v-for="plan in renewalPlans" :key="plan.id" :plan="plan" :active-subscriptions="activeSubscriptions" @select="selectPlanFromModal" />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    <!-- Image Preview Overlay -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="previewImage" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm" @click="previewImage = ''">
          <img :src="previewImage" alt="" class="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl" />
        </div>
      </Transition>
    </Teleport>
    <!-- Contact Group Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showContactGroupModal" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" @click.self="showContactGroupModal = false">
          <div class="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-dark-700 dark:bg-dark-900">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-[11px] font-semibold uppercase text-primary-700 dark:text-primary-300">Contact admin</p>
                <h3 class="mt-1 text-xl font-bold text-gray-900 dark:text-white">进群沟通</h3>
                <p class="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">请扫码加入群聊，直接和管理员确认充值金额与到账信息。</p>
              </div>
              <button class="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-dark-700 dark:hover:text-gray-200" @click="showContactGroupModal = false" aria-label="关闭">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div class="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-dark-700 dark:bg-dark-800/60">
              <img :src="contactGroupQrUrl" alt="进群二维码" class="mx-auto aspect-square w-full max-w-[280px] rounded-xl object-contain bg-white p-2 shadow-sm" />
            </div>
            <div class="mt-4 rounded-xl bg-primary-50 px-4 py-3 text-center dark:bg-primary-900/20">
              <p class="text-xs text-gray-500 dark:text-gray-400">群号</p>
              <p class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{{ contactGroupNumber }}</p>
              <button class="mt-3 btn btn-secondary w-full" @click="copyContactGroupNumber">复制群号</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePaymentStore } from '@/stores/payment'
import { useSubscriptionStore } from '@/stores/subscriptions'
import { useAppStore } from '@/stores'
import { paymentAPI } from '@/api/payment'
import { extractApiErrorMessage, extractI18nErrorMessage } from '@/utils/apiError'
import { isMobileDevice } from '@/utils/device'
import { hasPeakRate, formatPeakRateWindow, serverTimezoneLabel } from '@/utils/peak-rate'
import type { SubscriptionPlan, CheckoutInfoResponse, CreateOrderResult, OrderType } from '@/types/payment'
import AppLayout from '@/components/layout/AppLayout.vue'
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector.vue'
import { METHOD_ORDER, getPaymentPopupFeatures, isBuiltInAlipayMethod, isBuiltInWxpayMethod } from '@/components/payment/providerConfig'
import {
  PAYMENT_RECOVERY_STORAGE_KEY,
  buildCreateOrderPayload,
  clearPaymentRecoverySnapshot,
  decidePaymentLaunch,
  getVisibleMethods,
  normalizeVisibleMethod,
  readPaymentRecoverySnapshot,
  type PaymentRecoverySnapshot,
  writePaymentRecoverySnapshot,
} from '@/components/payment/paymentFlow'
import { platformBadgeClass, platformTextClass, platformLabel } from '@/utils/platformColors'
import SubscriptionPlanCard from '@/components/payment/SubscriptionPlanCard.vue'
import PaymentStatusPanel from '@/components/payment/PaymentStatusPanel.vue'
import { redeemAPI } from '@/api/redeem'
import userAPI from '@/api/user'
import type { UserAffiliateDetail } from '@/types'
import { useClipboard } from '@/composables/useClipboard'
import { formatCurrency } from '@/utils/format'
import { DEFAULT_PAYMENT_CURRENCY, formatPaymentAmount, normalizePaymentCurrency } from '@/components/payment/currency'
import { planValiditySuffix as validitySuffixOf } from '@/components/payment/validity'
import type { PaymentMethodOption } from '@/components/payment/PaymentMethodSelector.vue'
import { buildPaymentErrorToastMessage, describePaymentScenarioError } from './paymentUx'
import { hasWechatResumeQuery, parseWechatResumeRoute, stripWechatResumeQuery } from './paymentWechatResume'
import contactGroupQrUrl from '@/assets/jkapi-qq-group.png'

const i18n = useI18n()
const { t } = i18n
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const paymentStore = usePaymentStore()
const subscriptionStore = useSubscriptionStore()
const appStore = useAppStore()

const user = computed(() => authStore.user)
const activeSubscriptions = computed(() => subscriptionStore.activeSubscriptions)

const loading = ref(true)
const submitting = ref(false)
const errorMessage = ref('')
const errorHintMessage = ref('')
const amount = ref<number | null>(null)
const selectedMethod = ref('')
const selectedPlan = ref<SubscriptionPlan | null>(null)
const previewImage = ref('')
const redeemCode = ref('')
const redeemSubmitting = ref(false)
const redeemResult = ref<{ message: string; type: string; value: number; new_balance?: number; new_concurrency?: number } | null>(null)
const redeemError = ref('')
const affiliateDetail = ref<UserAffiliateDetail | null>(null)
const affiliateTransferring = ref(false)
const showContactGroupModal = ref(false)
const { copyToClipboard } = useClipboard()

const paymentPhase = ref<'select' | 'paying'>('select')
const yunmaoRechargeUrl = 'https://catfk.com/shop/jkapi'
const contactGroupNumber = '1107806881'

const inviteLink = computed(() => {
  if (!affiliateDetail.value) return ''
  const base = typeof window === 'undefined' ? '' : window.location.origin
  return `${base}/register?aff=${encodeURIComponent(affiliateDetail.value.aff_code)}`
})

const formattedAffiliateRebateRate = computed(() => {
  const rate = affiliateDetail.value?.effective_rebate_rate_percent ?? 0
  const rounded = Math.round(rate * 100) / 100
  return Number.isInteger(rounded) ? String(rounded) : String(rounded)
})

const affiliateRuleTitle = computed(() => (
  affiliateDetail.value
    ? `邀请好友，获得 ${formattedAffiliateRebateRate.value}% 充值返利`
    : '邀请好友，获得充值返利'
))

const affiliateRuleDescription = computed(() => (
  affiliateDetail.value
    ? t('affiliate.tips.line2', { rate: `${formattedAffiliateRebateRate.value}%` })
    : '分享专属邀请链接，好友充值后即可获得返利额度。'
))

async function loadCompactAffiliate(): Promise<void> {
  if (!showAffiliateSection.value) return
  try {
    affiliateDetail.value = await userAPI.getAffiliateDetail()
  } catch {
    affiliateDetail.value = null
  }
}

async function copyInviteLink(): Promise<void> {
  if (inviteLink.value) await copyToClipboard(inviteLink.value, '邀请链接已复制')
}

async function copyContactGroupNumber(): Promise<void> {
  await copyToClipboard(contactGroupNumber, '群号已复制')
}

async function transferAffiliateQuota(): Promise<void> {
  if (!affiliateDetail.value || affiliateDetail.value.aff_quota <= 0 || affiliateTransferring.value) return
  affiliateTransferring.value = true
  try {
    await userAPI.transferAffiliateQuota()
    await Promise.all([loadCompactAffiliate(), authStore.refreshUser().catch(() => undefined)])
    appStore.showSuccess('返利余额已转入账户')
  } catch (error) {
    appStore.showError(extractApiErrorMessage(error, '转入失败'))
  } finally {
    affiliateTransferring.value = false
  }
}

async function handleCompactRedeem(): Promise<void> {
  const code = redeemCode.value.trim()
  if (!code || redeemSubmitting.value) return
  redeemSubmitting.value = true
  redeemError.value = ''
  redeemResult.value = null
  try {
    const result = await redeemAPI.redeem(code)
    redeemResult.value = result
    redeemCode.value = ''
    await authStore.refreshUser()
    if (result.type === 'subscription') await subscriptionStore.fetchActiveSubscriptions(true)
    appStore.showSuccess('兑换成功')
  } catch (error) {
    redeemError.value = extractApiErrorMessage(error, '兑换失败')
  } finally {
    redeemSubmitting.value = false
  }
}

interface CreateOrderOptions {
  openid?: string
  wechatResumeToken?: string
  paymentType?: string
  isResume?: boolean
  mobileQrFallbackAttempted?: boolean
}

interface WeixinJSBridgeLike {
  invoke(
    action: string,
    payload: Record<string, unknown>,
    callback: (result: Record<string, unknown>) => void,
  ): void
}

function emptyPaymentState(): PaymentRecoverySnapshot {
  return {
    orderId: 0,
    amount: 0,
    qrCode: '',
    expiresAt: '',
    paymentType: '',
    payUrl: '',
    outTradeNo: '',
    clientSecret: '',
    intentId: '',
    currency: '',
    countryCode: '',
    paymentEnv: '',
    payAmount: 0,
    orderType: '',
    paymentMode: '',
    resumeToken: '',
    alipayMobilePrecreateDeepLink: false,
    createdAt: 0,
  }
}

function getWeixinJSBridge(): WeixinJSBridgeLike | undefined {
  return (window as Window & { WeixinJSBridge?: WeixinJSBridgeLike }).WeixinJSBridge
}

function waitForWeixinJSBridge(timeoutMs = 4000): Promise<WeixinJSBridgeLike | null> {
  const existing = getWeixinJSBridge()
  if (existing) return Promise.resolve(existing)

  return new Promise((resolve) => {
    let settled = false
    const finish = (bridge: WeixinJSBridgeLike | null) => {
      if (settled) return
      settled = true
      document.removeEventListener('WeixinJSBridgeReady', handleReady)
      document.removeEventListener('onWeixinJSBridgeReady', handleReady)
      window.clearTimeout(timer)
      resolve(bridge)
    }
    const handleReady = () => finish(getWeixinJSBridge() ?? null)
    const timer = window.setTimeout(() => finish(getWeixinJSBridge() ?? null), timeoutMs)
    document.addEventListener('WeixinJSBridgeReady', handleReady, false)
    document.addEventListener('onWeixinJSBridgeReady', handleReady, false)
  })
}

async function invokeWechatJsapiPayment(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const bridge = await waitForWeixinJSBridge()
  if (!bridge) {
    throw new Error('WECHAT_JSAPI_UNAVAILABLE')
  }
  return new Promise((resolve) => {
    bridge.invoke('getBrandWCPayRequest', payload, (result) => resolve(result || {}))
  })
}

const paymentState = ref<PaymentRecoverySnapshot>(emptyPaymentState())

function persistRecoverySnapshot(snapshot: PaymentRecoverySnapshot) {
  if (typeof window === 'undefined' || !snapshot.orderId) return
  writePaymentRecoverySnapshot(window.localStorage, snapshot, PAYMENT_RECOVERY_STORAGE_KEY)
}

function removeRecoverySnapshot() {
  if (typeof window === 'undefined') return
  clearPaymentRecoverySnapshot(window.localStorage, PAYMENT_RECOVERY_STORAGE_KEY)
}

function resetPayment() {
  paymentPhase.value = 'select'
  paymentState.value = emptyPaymentState()
  removeRecoverySnapshot()
}

async function redirectToPaymentResult(state: PaymentRecoverySnapshot): Promise<void> {
  const query: Record<string, string | undefined> = {}
  if (state.orderId > 0) {
    query.order_id = String(state.orderId)
  }
  if (state.outTradeNo) {
    query.out_trade_no = state.outTradeNo
  }
  if (state.resumeToken) {
    query.resume_token = state.resumeToken
  }
  await router.push({
    path: '/payment/result',
    query,
  })
}

function buildWechatOAuthAuthorizeUrl(
  authorizeUrl: string,
  context: { paymentType: string; orderType: OrderType; planId?: number; orderAmount: number },
): string {
  const normalizedUrl = authorizeUrl.trim()
  if (!normalizedUrl || typeof window === 'undefined') {
    return normalizedUrl
  }

  try {
    const targetUrl = new URL(normalizedUrl, window.location.origin)
    const redirectPath = targetUrl.searchParams.get('redirect') || '/purchase'
    const redirectUrl = new URL(redirectPath, window.location.origin)
    const paymentType = normalizeVisibleMethod(context.paymentType) || context.paymentType.trim() || 'wxpay'

    redirectUrl.searchParams.set('payment_type', paymentType)
    redirectUrl.searchParams.set('order_type', context.orderType)

    if (context.planId) {
      redirectUrl.searchParams.set('plan_id', String(context.planId))
    } else {
      redirectUrl.searchParams.delete('plan_id')
    }

    if (context.orderAmount > 0) {
      redirectUrl.searchParams.set('amount', String(context.orderAmount))
    } else {
      redirectUrl.searchParams.delete('amount')
    }

    targetUrl.searchParams.set('redirect', `${redirectUrl.pathname}${redirectUrl.search}`)
    return targetUrl.toString()
  } catch {
    return normalizedUrl
  }
}

function onPaymentDone() {
  const wasSubscription = paymentState.value.orderType === 'subscription'
  resetPayment()
  selectedPlan.value = null
  if (wasSubscription) {
    subscriptionStore.fetchActiveSubscriptions(true).catch(() => {})
  }
}

async function onPaymentSuccess() {
  const completedPayment = { ...paymentState.value }
  removeRecoverySnapshot()
  authStore.refreshUser()
  if (paymentState.value.orderType === 'subscription') {
    subscriptionStore.fetchActiveSubscriptions(true).catch(() => {})
  }
  await redirectToPaymentResult(completedPayment)
}

function onPaymentSettled() {
  removeRecoverySnapshot()
}

// All checkout data from single API call
const checkout = ref<CheckoutInfoResponse>({
  methods: {}, global_min: 0, global_max: 0,
  plans: [], balance_disabled: false, balance_recharge_multiplier: 1, subscription_usd_to_cny_rate: 0, recharge_fee_rate: 0, help_text: '', help_image_url: '', stripe_publishable_key: '',
})

const showAffiliateSection = computed(() => appStore.cachedPublicSettings?.affiliate_enabled !== false)

const visibleMethods = computed(() => getVisibleMethods(checkout.value.methods))
const enabledMethods = computed(() => Object.keys(visibleMethods.value))
const validAmount = computed(() => amount.value ?? 0)
// 订阅 CNY 换算汇率（1 USD = X CNY）。0 = 未配置，订阅保持 price 直付（与后端 opt-in 条件严格镜像）。
const subscriptionUsdToCnyRate = computed(() => {
  const rate = checkout.value.subscription_usd_to_cny_rate
  return Number.isFinite(rate) && rate > 0 ? rate : 0
})

// Check if an amount fits a method's [min, max]. 0 = no limit.
function amountFitsMethod(amt: number, methodType: string): boolean {
  if (amt <= 0) return true
  const ml = visibleMethods.value[methodType]
  if (!ml) return false
  if (ml.single_min > 0 && amt < ml.single_min) return false
  if (ml.single_max > 0 && amt > ml.single_max) return false
  return true
}

// Selected method's limits (for validation and error messages)
const selectedLimit = computed(() => visibleMethods.value[selectedMethod.value])
const selectedCurrency = computed(() => normalizePaymentCurrency(selectedLimit.value?.currency))
const localeCode = computed(() => {
  const raw = i18n.locale as unknown
  if (typeof raw === 'string') return raw
  if (raw && typeof raw === 'object' && 'value' in raw) {
    return String((raw as { value?: string }).value || '')
  }
  return undefined
})

function currencyFractionDigits(currency: string): number {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  } catch {
    return 2
  }
}

function roundPaymentAmount(value: number, currency: string): number {
  if (!Number.isFinite(value)) return 0
  const factor = 10 ** currencyFractionDigits(currency)
  return Math.round(value * factor) / factor
}

function ceilPaymentAmount(value: number, currency: string): number {
  if (!Number.isFinite(value)) return 0
  const factor = 10 ** currencyFractionDigits(currency)
  return Math.ceil(value * factor) / factor
}

function subscriptionPaymentAmountForCurrency(value: number, currency: string): number {
  const rate = subscriptionUsdToCnyRate.value
  if (rate <= 0 || currency !== DEFAULT_PAYMENT_CURRENCY) return roundPaymentAmount(value, currency)
  return roundPaymentAmount(value * rate, currency)
}

function formatSelectedPaymentAmount(value: number): string {
  return formatPaymentAmount(value, selectedCurrency.value, localeCode.value)
}

function formatSelectedSubscriptionPaymentAmount(value: number): string {
  return formatSelectedPaymentAmount(subscriptionPaymentAmountForCurrency(value, selectedCurrency.value))
}

const feeRate = computed(() => checkout.value?.recharge_fee_rate ?? 0)

const subPaymentAmount = computed(() => {
  const price = selectedPlan.value?.price ?? 0
  return subscriptionPaymentAmountForCurrency(price, selectedCurrency.value)
})

const subFeeAmount = computed(() => {
  if (feeRate.value <= 0 || subPaymentAmount.value <= 0) return 0
  return ceilPaymentAmount((subPaymentAmount.value * feeRate.value) / 100, selectedCurrency.value)
})

const subTotalAmount = computed(() => {
  if (feeRate.value <= 0 || subPaymentAmount.value <= 0) return subPaymentAmount.value
  return roundPaymentAmount(subPaymentAmount.value + subFeeAmount.value, selectedCurrency.value)
})

function subscriptionTotalAmountForCurrency(value: number, currency: string): number {
  const paymentAmount = subscriptionPaymentAmountForCurrency(value, currency)
  if (feeRate.value <= 0 || paymentAmount <= 0) return paymentAmount
  const fee = ceilPaymentAmount((paymentAmount * feeRate.value) / 100, currency)
  return roundPaymentAmount(paymentAmount + fee, currency)
}

// Subscription-specific: method options based on gateway pay amount
const subMethodOptions = computed<PaymentMethodOption[]>(() => {
  const price = selectedPlan.value?.price ?? 0
  return enabledMethods.value.map((type) => {
    const ml = visibleMethods.value[type]
    const currency = normalizePaymentCurrency(ml?.currency)
    return {
      type,
      display_name: ml?.display_name,
      fee_rate: ml?.fee_rate ?? 0,
      available: ml?.available !== false && amountFitsMethod(subscriptionTotalAmountForCurrency(price, currency), type),
    }
  })
})

const balanceMethodOptions = computed<PaymentMethodOption[]>(() =>
  enabledMethods.value.map((type) => {
    const ml = visibleMethods.value[type]
    return {
      type,
      display_name: ml?.display_name,
      fee_rate: ml?.fee_rate ?? 0,
      available: ml?.available !== false && amountFitsMethod(validAmount.value, type),
    }
  }),
)

const canSubmitSubscription = computed(() =>
  selectedPlan.value !== null
    && amountFitsMethod(subTotalAmount.value, selectedMethod.value)
    && selectedLimit.value?.available !== false
)

const canSubmitBalance = computed(() =>
  validAmount.value > 0
    && amountFitsMethod(validAmount.value, selectedMethod.value)
    && selectedLimit.value?.available !== false,
)

// Auto-switch to first available method when current selection can't handle the amount
watch(() => [validAmount.value, selectedMethod.value] as const, ([amt, method]) => {
  if (amt <= 0 || amountFitsMethod(amt, method)) return
  const available = enabledMethods.value.find((m) => amountFitsMethod(amt, m))
  if (available) selectedMethod.value = available
})

// Payment button class: follows selected payment method color
const paymentButtonClass = computed(() => {
  const m = selectedMethod.value
  if (!m) return 'btn-primary'
  if (isBuiltInAlipayMethod(m)) return 'btn-alipay'
  if (isBuiltInWxpayMethod(m)) return 'btn-wxpay'
  if (m === 'stripe') return 'btn-stripe'
  if (m === 'airwallex') return 'btn-airwallex'
  return 'btn-primary'
})

// Subscription confirm: platform accent colors (clean card, no gradient)
const planBadgeClass = computed(() => platformBadgeClass(selectedPlan.value?.group_platform || ''))
const planTextClass = computed(() => platformTextClass(selectedPlan.value?.group_platform || ''))

// Renewal modal state
const showRenewalModal = ref(false)
const renewGroupId = ref<number | null>(null)
const renewalPlans = computed(() => {
  if (renewGroupId.value == null) return []
  return checkout.value.plans.filter(p => p.group_id === renewGroupId.value)
})

const planValiditySuffix = computed(() => {
  if (!selectedPlan.value) return ''
  return validitySuffixOf(selectedPlan.value, t)
})

function planHasPeakRate(plan: SubscriptionPlan): boolean {
  return hasPeakRate(plan)
}

function planPeakRateLabel(plan: SubscriptionPlan): string {
  return formatPeakRateWindow(plan, serverTimezoneLabel(appStore.cachedPublicSettings?.server_utc_offset))
}

function selectPlanFromModal(plan: SubscriptionPlan) {
  showRenewalModal.value = false
  renewGroupId.value = null
  selectedPlan.value = plan
  errorMessage.value = ''
}

function closeRenewalModal() {
  showRenewalModal.value = false
  renewGroupId.value = null
}

async function confirmSubscribe() {
  if (!selectedPlan.value || submitting.value) return
  await createOrder(selectedPlan.value.price, 'subscription', selectedPlan.value.id)
}

async function confirmRecharge() {
  if (!canSubmitBalance.value || submitting.value) return
  await createOrder(validAmount.value, 'balance')
}

async function createOrder(orderAmount: number, orderType: OrderType, planId?: number, options: CreateOrderOptions = {}) {
  submitting.value = true
  errorMessage.value = ''
  errorHintMessage.value = ''
  const requestType = normalizeVisibleMethod(options.paymentType || selectedMethod.value) || options.paymentType || selectedMethod.value
  try {
    const payload = buildCreateOrderPayload({
      amount: orderAmount,
      paymentType: requestType,
      orderType,
      planId,
      origin: typeof window !== 'undefined' ? window.location.origin : '',
      isMobile: isMobileDevice(),
      isWechatBrowser: typeof window !== 'undefined' && /MicroMessenger/i.test(window.navigator.userAgent),
      forceQRCode: !!(checkout.value.alipay_force_qrcode && normalizeVisibleMethod(requestType) === 'alipay'),
      mobilePrecreateDeepLink: checkout.value.alipay_mobile_precreate_deep_link === true,
    })
    if (options.openid) {
      payload.openid = options.openid
    }
    if (options.wechatResumeToken) {
      payload.wechat_resume_token = options.wechatResumeToken
    }

    const result = await paymentStore.createOrder(payload) as CreateOrderResult & { resume_token?: string }
    const openWindow = (url: string) => {
      const win = window.open(url, 'paymentPopup', getPaymentPopupFeatures())
      if (!win || win.closed) {
        window.location.href = url
      }
    }
    const visibleMethod = normalizeVisibleMethod(requestType) || requestType
    // When user clicks the dedicated Stripe button, leave method blank so the
    // landing page renders Stripe's full Payment Element (card/link/alipay/wxpay).
    const stripeMethod = visibleMethod === 'stripe'
      ? ''
      : visibleMethod === 'wxpay' ? 'wechat_pay' : 'alipay'
    const stripeRouteUrl = result.client_secret && visibleMethod !== 'airwallex'
      ? router.resolve({
        path: '/payment/stripe',
        query: {
          order_id: String(result.order_id),
          client_secret: result.client_secret,
          method: stripeMethod || undefined,
          resume_token: result.resume_token || undefined,
        },
      }).href
      : ''
    const airwallexRouteUrl = result.client_secret && result.intent_id
      ? router.resolve({
        path: '/payment/airwallex',
        query: {
          order_id: String(result.order_id),
          out_trade_no: result.out_trade_no || undefined,
          resume_token: result.resume_token || undefined,
        },
      }).href
      : ''
    const decision = decidePaymentLaunch(result, {
      visibleMethod,
      orderType,
      isMobile: isMobileDevice(),
      isWechatBrowser: typeof window !== 'undefined' && /MicroMessenger/i.test(window.navigator.userAgent),
      forceQRCode: !!(checkout.value.alipay_force_qrcode && visibleMethod === 'alipay'),
      mobilePrecreateDeepLink: checkout.value.alipay_mobile_precreate_deep_link === true,
      stripePopupUrl: stripeRouteUrl,
      stripeRouteUrl,
      airwallexRouteUrl,
    })

    if (decision.kind === 'wechat_oauth' && decision.oauth?.authorize_url) {
      window.location.href = buildWechatOAuthAuthorizeUrl(decision.oauth.authorize_url, {
        paymentType: visibleMethod,
        orderType,
        planId,
        orderAmount,
      })
      return
    }

    if (decision.kind === 'unhandled') {
      applyScenarioError({ reason: 'UNHANDLED_PAYMENT_SCENARIO' }, visibleMethod)
      return
    }

    paymentState.value = decision.paymentState
    paymentPhase.value = 'paying'
    persistRecoverySnapshot(decision.recovery)

    if (decision.kind === 'stripe_popup') {
      openWindow(decision.paymentState.payUrl)
      return
    }
    if (decision.kind === 'stripe_route') {
      window.location.href = decision.paymentState.payUrl
      return
    }
    if (decision.kind === 'airwallex_route') {
      window.location.href = decision.paymentState.payUrl
      return
    }
    if (decision.kind === 'wechat_jsapi' && decision.jsapi) {
      try {
        const jsapiResult = await invokeWechatJsapiPayment(decision.jsapi as Record<string, unknown>)
        const errMsg = String(jsapiResult.err_msg || '').toLowerCase()
        if (errMsg.includes('cancel')) {
          appStore.showInfo(t('payment.qr.cancelled'))
          resetPayment()
        } else if (errMsg && !errMsg.includes('ok')) {
          resetPayment()
          const fallbackApplied = await attemptMobileQrFallback(
            { reason: 'WECHAT_JSAPI_FAILED', message: errMsg },
            {
              orderAmount,
              orderType,
              planId,
              paymentType: visibleMethod,
              attempted: options.mobileQrFallbackAttempted === true,
            },
          )
          if (!fallbackApplied) {
            applyScenarioError({ reason: 'WECHAT_JSAPI_FAILED', message: errMsg }, visibleMethod)
          }
        } else {
          const resultState = { ...decision.paymentState }
          resetPayment()
          await redirectToPaymentResult(resultState)
        }
      } catch (err: unknown) {
        resetPayment()
        const fallbackApplied = await attemptMobileQrFallback(err, {
          orderAmount,
          orderType,
          planId,
          paymentType: visibleMethod,
          attempted: options.mobileQrFallbackAttempted === true,
        })
        if (!fallbackApplied) {
          throw err
        }
      }
      return
    }
    if (decision.kind === 'redirect_waiting' && decision.paymentState.payUrl) {
      if (isMobileDevice()) {
        window.location.href = decision.paymentState.payUrl
        return
      }
      openWindow(decision.paymentState.payUrl)
    }
  } catch (err: unknown) {
    const apiErr = err as Record<string, unknown>
    if (apiErr.reason === 'TOO_MANY_PENDING') {
      const metadata = apiErr.metadata as Record<string, unknown> | undefined
      errorMessage.value = t('payment.errors.tooManyPending', { max: metadata?.max || '' })
      errorHintMessage.value = ''
    } else if (apiErr.reason === 'CANCEL_RATE_LIMITED') {
      errorMessage.value = t('payment.errors.cancelRateLimited')
      errorHintMessage.value = ''
    } else if (await attemptMobileQrFallback(err, {
      orderAmount,
      orderType,
      planId,
      paymentType: requestType,
      attempted: options.mobileQrFallbackAttempted === true,
    })) {
      return
    } else {
      const handled = applyScenarioError(
        err,
        normalizeVisibleMethod(options.paymentType || selectedMethod.value) || selectedMethod.value,
      )
      if (!handled) {
        errorMessage.value = extractI18nErrorMessage(err, t, 'payment.errors', extractApiErrorMessage(err, t('payment.result.failed')))
        errorHintMessage.value = ''
      }
      if (handled) {
        return
      }
    }
    appStore.showError(buildPaymentErrorToastMessage(errorMessage.value, errorHintMessage.value))
  } finally {
    submitting.value = false
  }
}

interface MobileQrFallbackContext {
  orderAmount: number
  orderType: OrderType
  planId?: number
  paymentType: string
  attempted: boolean
}

function shouldFallbackToDesktopQr(err: unknown, paymentMethod: string, attempted: boolean): boolean {
  if (attempted || !isMobileDevice()) {
    return false
  }

  const normalizedMethod = normalizeVisibleMethod(paymentMethod) || paymentMethod
  const reason = typeof err === 'object' && err && 'reason' in err && typeof err.reason === 'string'
    ? err.reason
    : ''
  const message = err instanceof Error
    ? err.message
    : (typeof err === 'object' && err && 'message' in err && typeof err.message === 'string'
      ? err.message
      : '')
  const normalizedMessage = message.toLowerCase()

  if (normalizedMethod === 'wxpay') {
    return reason === 'WECHAT_H5_NOT_AUTHORIZED'
      || reason === 'WECHAT_PAYMENT_MP_NOT_CONFIGURED'
      || reason === 'WECHAT_JSAPI_FAILED'
      || reason === 'PAYMENT_GATEWAY_ERROR'
      || reason === 'UNHANDLED_PAYMENT_SCENARIO'
      || normalizedMessage.includes('weixinjsbridge is unavailable')
      || normalizedMessage.includes('wechat_jsapi_unavailable')
  }

  if (normalizedMethod === 'alipay') {
    return reason === 'PAYMENT_GATEWAY_ERROR' || reason === 'UNHANDLED_PAYMENT_SCENARIO'
  }

  return false
}

async function attemptMobileQrFallback(err: unknown, context: MobileQrFallbackContext): Promise<boolean> {
  if (!shouldFallbackToDesktopQr(err, context.paymentType, context.attempted)) {
    return false
  }

  try {
    const visibleMethod = normalizeVisibleMethod(context.paymentType) || context.paymentType
    const payload = buildCreateOrderPayload({
      amount: context.orderAmount,
      paymentType: visibleMethod,
      orderType: context.orderType,
      planId: context.planId,
      origin: typeof window !== 'undefined' ? window.location.origin : '',
      isMobile: false,
      isWechatBrowser: false,
    })
    const result = await paymentStore.createOrder(payload) as CreateOrderResult & { resume_token?: string }
    const stripeMethod = visibleMethod === 'wxpay' ? 'wechat_pay' : 'alipay'
    const stripeRouteUrl = result.client_secret
      ? router.resolve({
        path: '/payment/stripe',
        query: {
          order_id: String(result.order_id),
          client_secret: result.client_secret,
          method: stripeMethod,
          resume_token: result.resume_token || undefined,
        },
      }).href
      : ''
    const decision = decidePaymentLaunch(result, {
      visibleMethod,
      orderType: context.orderType,
      isMobile: false,
      isWechatBrowser: false,
      stripePopupUrl: stripeRouteUrl,
      stripeRouteUrl,
    })

    if (decision.kind !== 'qr_waiting' || !decision.paymentState.qrCode) {
      return false
    }

    errorMessage.value = ''
    errorHintMessage.value = ''
    paymentState.value = decision.paymentState
    paymentPhase.value = 'paying'
    persistRecoverySnapshot(decision.recovery)
    appStore.showWarning(t('payment.errors.mobilePaymentFallbackToQr'))
    return true
  } catch {
    return false
  }
}

function applyScenarioError(err: unknown, paymentMethod: string): boolean {
  const descriptor = describePaymentScenarioError(err, {
    paymentMethod,
    isMobile: isMobileDevice(),
    isWechatBrowser: typeof window !== 'undefined' && /MicroMessenger/i.test(window.navigator.userAgent),
  })
  if (!descriptor) {
    errorMessage.value = ''
    errorHintMessage.value = ''
    return false
  }
  errorMessage.value = t(descriptor.messageKey)
  errorHintMessage.value = descriptor.hintKey ? t(descriptor.hintKey) : ''
  appStore.showError(buildPaymentErrorToastMessage(errorMessage.value, errorHintMessage.value))
  return true
}

async function resumeWechatPaymentFromQuery() {
  const resume = parseWechatResumeRoute(route.query, checkout.value.plans, validAmount.value)
  if (!resume) {
    return
  }

  selectedMethod.value = resume.paymentType
  if (resume.orderType === 'balance' && resume.orderAmount > 0) {
    amount.value = resume.orderAmount
  }
  if (resume.orderType === 'subscription' && resume.planId) {
    selectedPlan.value = checkout.value.plans.find(plan => plan.id === resume.planId) ?? null
  }

  await router.replace({ path: route.path, query: stripWechatResumeQuery(route.query) })

  if (resume.wechatResumeToken) {
    await createOrder(0, resume.orderType, resume.planId, {
      wechatResumeToken: resume.wechatResumeToken,
      paymentType: resume.paymentType,
      isResume: true,
    })
    return
  }

  if (resume.orderAmount > 0 && resume.openid) {
    await createOrder(resume.orderAmount, resume.orderType, resume.planId, {
      openid: resume.openid,
      paymentType: resume.paymentType,
      isResume: true,
    })
  }
}

onMounted(async () => {
  try {
    const res = await paymentAPI.getCheckoutInfo()
    checkout.value = res.data
    if (enabledMethods.value.length) {
      const order: readonly string[] = METHOD_ORDER
      const sorted = [...enabledMethods.value].sort((a, b) => {
        const ai = order.indexOf(a)
        const bi = order.indexOf(b)
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
      })
      selectedMethod.value = sorted[0]
    }
    if (typeof window !== 'undefined') {
      if (hasWechatResumeQuery(route.query)) {
        removeRecoverySnapshot()
      }
      const routeResumeToken = typeof route.query.resume_token === 'string'
        ? route.query.resume_token
        : typeof route.query.wechat_resume_token === 'string'
          ? route.query.wechat_resume_token
          : undefined
      const restored = readPaymentRecoverySnapshot(
        window.localStorage.getItem(PAYMENT_RECOVERY_STORAGE_KEY),
        { resumeToken: routeResumeToken },
      )
      if (restored) {
        paymentState.value = restored
        paymentPhase.value = 'paying'
        const restoredMethod = normalizeVisibleMethod(restored.paymentType)
          || (visibleMethods.value[restored.paymentType] ? restored.paymentType : '')
        if (restoredMethod) {
          selectedMethod.value = restoredMethod
        }
      } else {
        removeRecoverySnapshot()
      }
    }
    await resumeWechatPaymentFromQuery()
    // Handle renewal navigation: ?tab=subscription&group=123
    if (route.query.tab === 'subscription') {
      if (route.query.group) {
        const groupId = Number(route.query.group)
        const groupPlans = checkout.value.plans.filter(p => p.group_id === groupId)
        if (groupPlans.length === 1) {
          selectedPlan.value = groupPlans[0]
        } else if (groupPlans.length > 1) {
          renewGroupId.value = groupId
          showRenewalModal.value = true
        }
      }
    }
  } catch (err: unknown) { appStore.showError(extractI18nErrorMessage(err, t, 'payment.errors', t('common.error'))) }
  finally { loading.value = false }
  // Fetch active subscriptions (uses cache, non-blocking)
  subscriptionStore.fetchActiveSubscriptions().catch(() => {})
  loadCompactAffiliate().catch(() => {})
})
</script>
