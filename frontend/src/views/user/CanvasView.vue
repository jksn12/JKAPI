<template>
  <div class="canvas-page">
    <div class="canvas-shell">
      <aside class="canvas-toolbar" aria-label="Canvas tools">
        <RouterLink class="tool-button library-tool" to="/canvas/library" title="返回我的画布">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h6l2 2h8v12H4V5Zm2 4v8h12V9H6Z" /></svg>
        </RouterLink>
        <span class="tool-divider"></span>
        <button class="tool-button" type="button" :title="copy.addPrompt" @click="addNode('prompt')">
          <span class="tool-icon">T</span>
        </button>
        <button class="tool-button" type="button" :title="copy.addImage" @click="addNode('image')">
          <span class="tool-icon">I</span>
        </button>
        <button class="tool-button" type="button" :title="copy.addVideo" @click="addNode('video')">
          <span class="tool-icon">V</span>
        </button>
        <button class="tool-button" type="button" :title="copy.addAudio" @click="addNode('audio')">
          <span class="tool-icon">A</span>
        </button>
        <button class="tool-button" type="button" :title="copy.addOutput" @click="addNode('output')">
          <span class="tool-icon">O</span>
        </button>
        <span class="tool-divider"></span>
        <button class="tool-button" type="button" title="撤销" :disabled="!undoStack.length" @click="undoBoard">
          <span class="tool-icon">↶</span>
        </button>
        <button class="tool-button" type="button" title="重做" :disabled="!redoStack.length" @click="redoBoard">
          <span class="tool-icon">↷</span>
        </button>
        <button class="tool-button" type="button" :title="copy.connect" :class="{ active: connectMode }" @click="toggleConnectMode">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h4v2H7a3 3 0 0 0 0 6h4v2H7A5 5 0 0 1 7 7Zm6 0h4a5 5 0 0 1 0 10h-4v-2h4a3 3 0 0 0 0-6h-4V7Zm-5 4h8v2H8v-2Z" /></svg>
        </button>
        <button class="tool-button" type="button" :title="copy.fit" @click="fitView">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v2H6v4H4V4Zm10 0h6v6h-2V6h-4V4ZM6 14v4h4v2H4v-6h2Zm12 4v-4h2v6h-6v-2h4Z" /></svg>
        </button>
        <button class="tool-button" type="button" :title="copy.zoomIn" @click="zoomBy(0.12)">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4a6 6 0 1 1-3.7 10.7L3 18l1.4 1.4 3.3-3.3A6 6 0 0 1 10 4Zm-1 3h2v2h2v2h-2v2H9v-2H7V9h2V7Z" /></svg>
        </button>
        <button class="tool-button" type="button" :title="copy.zoomOut" @click="zoomBy(-0.12)">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4a6 6 0 1 1-3.7 10.7L3 18l1.4 1.4 3.3-3.3A6 6 0 0 1 10 4Zm-3 5h6v2H7V9Z" /></svg>
        </button>
        <button class="tool-button" type="button" :title="copy.autoLayout" @click="autoLayout">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h6v6H4V5Zm2 2v2h2V7H6Zm8-2h6v6h-6V5Zm2 2v2h2V7h-2ZM4 15h6v6H4v-6Zm2 2v2h2v-2H6Zm8-2h6v6h-6v-6Zm2 2v2h2v-2h-2Zm-5-7h2v2h-2v-2Zm0 5h2v2h-2v-2Z" /></svg>
        </button>
        <button class="tool-button" type="button" :title="copy.downloadAll" :disabled="!downloadableNodes.length" @click="downloadAllOutputs">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19h14v2H5v-2Zm6-16h2v9l3-3 1.4 1.4L12 15.8l-5.4-5.4L8 9l3 3V3Z" /></svg>
        </button>
        <button class="tool-button" type="button" :title="copy.promptPreview" :disabled="!selectedPromptNode" @click="openPromptPreview">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v2H4V5Zm0 4h16v2H4V9Zm0 4h10v2H4v-2Zm0 4h12v2H4v-2Z" /></svg>
        </button>
        <button class="tool-button" type="button" :title="copy.exportPng" :disabled="!nodes.length" @click="exportCanvasPng">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5V4Zm2 2v12h10V6H7Zm1 9 3-4 2 3 1.2-1.5L16 15H8Z" /></svg>
        </button>
        <button class="tool-button" type="button" :title="copy.save" @click="saveBoard">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h12l2 2v16H5V3Zm2 2v14h10V6.2L15.8 5H15v5H8V5H7Zm3 0v3h3V5h-3Zm-1 9h6v2H9v-2Z" /></svg>
        </button>
        <button class="tool-button" type="button" :title="copy.exportBoard" @click="exportBoard">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 3h2v10l3-3 1.4 1.4L12 16.8l-5.4-5.4L8 10l3 3V3ZM5 19h14v2H5v-2Z" /></svg>
        </button>
        <button class="tool-button" type="button" :title="copy.importBoard" @click="importInputRef?.click()">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 21h2V11l3 3 1.4-1.4L12 7.2l-5.4 5.4L8 14l3-3v10ZM5 3h14v2H5V3Z" /></svg>
        </button>
        <input ref="importInputRef" class="sr-only" type="file" accept="application/json,.json" @change="importBoard" />
        <button class="tool-button danger" type="button" :title="copy.clear" @click="resetBoard">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 9h2v9H8V9Zm6 0h2v9h-2V9ZM5 6h14v2H5V6Zm3-3h8v2H8V3Zm-1 7h2v9h6v-9h2v11H7V10Z" /></svg>
        </button>
      </aside>

      <section class="canvas-workspace">
        <header class="canvas-topbar">
          <div>
            <h1>{{ copy.title }}</h1>
            <p>{{ copy.subtitle }}</p>
          </div>
          <div class="topbar-actions">
            <RouterLink class="mini-action secondary editor-library-link" to="/canvas/library">画布库</RouterLink>
            <label class="model-field">
              <span>{{ copy.model }}</span>
              <select v-model="model">
                <option v-for="option in imageModels" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
            </label>
            <button class="primary-action" type="button" :disabled="!selectedPromptNode || running" @click="runSelected">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7L8 5Z" /></svg>
              <span>{{ running ? copy.running : copy.run }}</span>
            </button>
          </div>
        </header>

        <div
          ref="viewportRef"
          class="canvas-viewport"
          :class="[`pattern-${canvasPattern}`, { dragging: draggingFile }]"
          @wheel.prevent="handleWheel"
          @pointerdown="startPan"
          @dragenter.prevent="draggingFile = true"
          @dragover.prevent="draggingFile = true"
          @dragleave.prevent="draggingFile = false"
          @drop.prevent="handleCanvasDrop"
        >
          <div v-if="draggingFile" class="drop-hint">{{ copy.dropImage }}</div>
          <div class="canvas-grid" :style="boardStyle">
            <svg class="edge-layer" viewBox="-4000 -4000 8000 8000">
              <path
                v-for="edge in edges"
                :key="edge.id"
                class="edge-path"
                :class="{ selected: selectedEdgeId === edge.id }"
                :d="edgePath(edge)"
                @pointerdown.stop="selectEdge(edge.id)"
              />
            </svg>

            <article
              v-for="node in nodes"
              :key="node.id"
              class="canvas-node"
              :class="[`node-${node.kind}`, { selected: selectedNodeId === node.id, source: pendingSourceId === node.id }]"
              :style="{ transform: `translate(${node.x}px, ${node.y}px)` }"
              @pointerdown.stop="startNodeDrag(node.id, $event)"
              @click.stop="handleNodeClick(node.id)"
              @contextmenu.prevent.stop="openNodeMenu(node.id, $event)"
            >
              <div class="node-head">
                <span class="node-type">{{ nodeLabel(node.kind) }}</span>
                <div class="node-head-actions">
                  <button class="node-icon-button" type="button" :title="copy.duplicateNode" @click.stop="duplicateNode(node.id)">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v10H7V7Zm-3 3h2v9h9v2H4V10Zm5-1v6h6V9H9Z" /></svg>
                  </button>
                  <button class="node-icon-button" type="button" :title="copy.deleteNode" @click.stop="deleteNode(node.id)">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 9h2v9H8V9Zm6 0h2v9h-2V9ZM5 6h14v2H5V6Zm3-3h8v2H8V3Z" /></svg>
                  </button>
                </div>
              </div>
              <input v-model.trim="node.title" class="node-title" @pointerdown.stop />
              <textarea
                v-if="(node.kind !== 'output' || !outputImageSrc(node)) && !referenceImageSrc(node)"
                v-model="node.content"
                class="node-content"
                :placeholder="node.kind === 'image' ? copy.imagePlaceholder : copy.promptPlaceholder"
                :readonly="node.kind === 'output'"
                @pointerdown.stop
              ></textarea>
              <div v-if="node.kind === 'image' && referenceImageSrc(node)" class="node-preview" @pointerdown.stop>
                <img :src="referenceImageSrc(node)" :alt="node.title" @dblclick="openImagePreview(node)" />
                <p class="node-preview-meta">{{ node.content || node.referenceImageName || copy.referenceImage }}</p>
                <div class="node-preview-actions">
                  <button class="mini-action secondary" type="button" @click.stop="clearReferenceImage(node)">
                    {{ copy.removeImage }}
                  </button>
                </div>
              </div>
              <div v-if="node.kind === 'output' && outputImageSrc(node)" class="node-preview" @pointerdown.stop>
                <img :src="outputImageSrc(node)" :alt="node.title" @dblclick="openImagePreview(node)" />
                <p class="node-preview-meta">{{ node.content || copy.generatedImage }}</p>
                <div class="node-preview-actions">
                  <button class="mini-action secondary" type="button" :disabled="downloadingNodeId === node.id" @click.stop="copyImage(node)">
                    {{ copy.copyImage }}
                  </button>
                  <button class="mini-action secondary" type="button" :disabled="downloadingNodeId === node.id" @click.stop="downloadImage(node)">
                    {{ downloadingNodeId === node.id ? copy.downloading : copy.download }}
                  </button>
                  <button class="mini-action secondary" type="button" @click.stop="makeReferenceFromOutput(node)">
                    {{ copy.useAsReference }}
                  </button>
                </div>
              </div>
              <div v-if="node.kind === 'video' && node.mediaUrl" class="node-preview" @pointerdown.stop>
                <video :src="node.mediaUrl" controls preload="metadata"></video>
                <p class="node-preview-meta">{{ node.mediaName || node.content }}</p>
              </div>
              <div v-if="node.kind === 'audio' && node.mediaUrl" class="node-preview" @pointerdown.stop>
                <audio :src="node.mediaUrl" controls preload="metadata"></audio>
                <p class="node-preview-meta">{{ node.mediaName || node.content }}</p>
              </div>
              <div class="node-foot">
                <span>{{ incomingCount(node.id) }} -> {{ outgoingCount(node.id) }}</span>
                <button v-if="node.kind === 'prompt'" class="mini-action" type="button" :disabled="running" @click.stop="runNode(node.id)">
                  {{ copy.runShort }}
                </button>
              </div>
            </article>
          </div>
          <button v-if="nodes.length" class="canvas-minimap" type="button" title="小地图，点击适配视图" @click.stop="fitView">
            <span v-for="node in nodes" :key="node.id" :class="`map-${node.kind}`" :style="minimapNodeStyle(node)"></span>
          </button>
        </div>
      </section>

      <aside class="canvas-inspector">
        <div class="panel-section">
          <h2>{{ copy.inspector }}</h2>
          <div class="choice-section">
            <div class="choice-heading">
              <span>{{ copy.imageLine }}</span>
              <small>{{ loadingKeys ? copy.loadingKeys : copy.imageLineHint }}</small>
            </div>
            <div class="route-list">
              <button
                v-for="key in imageApiKeys"
                :key="key.id"
                class="route-card"
                :class="{ active: selectedApiKeyId === String(key.id) }"
                type="button"
                @click="selectApiKey(key.id)"
              >
                <span class="choice-check">✓</span>
                <span class="route-main">
                  <strong>{{ key.group?.name || key.name }}</strong>
                  <small>{{ key.name }}</small>
                </span>
                <span class="route-price">{{ routePriceLabel(key) }}</span>
              </button>
            </div>
            <button v-if="!imageApiKeys.length && !loadingKeys" class="route-card manual" type="button" @click="selectedApiKeyId = ''">
              <span class="choice-check">+</span>
              <span class="route-main">
                <strong>{{ copy.manualKey }}</strong>
                <small>{{ copy.noImageKey }}</small>
              </span>
            </button>
          </div>
          <label v-if="!selectedApiKey" class="field">
            <span>{{ copy.manualKey }}</span>
            <input v-model.trim="manualApiKey" type="password" autocomplete="off" />
          </label>
          <label class="field">
            <span>{{ copy.system }}</span>
            <textarea v-model="systemPrompt" @change="saveBoard"></textarea>
          </label>
          <div class="choice-section collapsible-choice">
            <button class="choice-heading choice-heading-button" type="button" :aria-expanded="sizePanelOpen" @click="toggleChoicePanel('size')">
              <span class="choice-heading-text">
                <span>{{ copy.size }}</span>
                <small>{{ copy.sizeHint }}</small>
              </span>
              <span class="choice-heading-summary">
                {{ selectedSizeOption.label }}
                <em>{{ selectedSizeOption.tier }}</em>
              </span>
              <span class="collapse-icon" :class="{ open: sizePanelOpen }">⌄</span>
            </button>
            <button v-if="!sizePanelOpen" class="choice-card choice-summary-card active" type="button" @click="toggleChoicePanel('size')">
              <span class="size-icon" :class="`size-${selectedSizeOption.icon}`"></span>
              <span class="choice-text">
                <strong>{{ selectedSizeOption.label }}</strong>
                <small>{{ selectedSizeOption.description }}</small>
                <em>{{ copy.billingTier }} · {{ selectedSizeOption.tier }} · {{ selectedSizeOption.price }}</em>
              </span>
              <span class="choice-check">✓</span>
            </button>
            <div v-else class="choice-list">
              <button
                v-for="option in sizeOptions"
                :key="option.value"
                class="choice-card"
                :class="{ active: imageSize === option.value }"
                type="button"
                @click="selectImageSize(option.value)"
              >
                <span class="size-icon" :class="`size-${option.icon}`"></span>
                <span class="choice-text">
                  <strong>{{ option.label }}</strong>
                  <small>{{ option.description }}</small>
                  <em>{{ copy.billingTier }} · {{ option.tier }} · {{ option.price }}</em>
                </span>
                <span class="choice-check">✓</span>
              </button>
            </div>
          </div>
          <div class="choice-section collapsible-choice">
            <button class="choice-heading choice-heading-button" type="button" :aria-expanded="qualityPanelOpen" @click="toggleChoicePanel('quality')">
              <span class="choice-heading-text">
                <span>{{ copy.quality }}</span>
                <small>{{ copy.qualityHint }}</small>
              </span>
              <span class="choice-heading-summary">
                {{ selectedQualityOption.label }}
                <em>{{ selectedQualityOption.meta }}</em>
              </span>
              <span class="collapse-icon" :class="{ open: qualityPanelOpen }">⌄</span>
            </button>
            <button v-if="!qualityPanelOpen" class="choice-card choice-summary-card quality-card active" type="button" @click="toggleChoicePanel('quality')">
              <span class="quality-gem" :class="`quality-${selectedQualityOption.value}`"></span>
              <span class="choice-text">
                <strong>{{ selectedQualityOption.label }}</strong>
                <small>{{ selectedQualityOption.description }}</small>
                <em>{{ selectedQualityOption.meta }}</em>
              </span>
              <span class="choice-check">✓</span>
            </button>
            <div v-else class="choice-list">
              <button
                v-for="option in qualityOptions"
                :key="option.value"
                class="choice-card quality-card"
                :class="{ active: imageQuality === option.value }"
                type="button"
                @click="selectImageQuality(option.value)"
              >
                <span class="quality-gem" :class="`quality-${option.value}`"></span>
                <span class="choice-text">
                  <strong>{{ option.label }}</strong>
                  <small>{{ option.description }}</small>
                  <em>{{ option.meta }}</em>
                </span>
                <span class="choice-check">✓</span>
              </button>
            </div>
          </div>
          <label class="field">
            <span>{{ copy.format }}</span>
            <select v-model="outputFormat" @change="saveBoard">
              <option v-for="option in outputFormats" :key="option" :value="option">{{ option }}</option>
            </select>
          </label>
          <div class="field-grid">
            <label class="field">
              <span>{{ copy.count }}</span>
              <select v-model.number="imageCount" @change="saveBoard">
                <option v-for="option in imageCounts" :key="option" :value="option">{{ option }}</option>
              </select>
            </label>
            <label class="field checkbox-field">
              <input v-model="confirmBeforeRun" type="checkbox" @change="saveBoard" />
              <span>{{ copy.confirmCost }}</span>
            </label>
          </div>
          <div class="status-line">
            <span>{{ imageCount > 1 ? copy.estimateTotal : copy.estimate }}</span>
            <strong>{{ estimatedPrice }}</strong>
          </div>
        </div>

        <div class="panel-section">
          <h2>{{ copy.templates }}</h2>
          <div class="template-grid">
            <button
              v-for="item in promptTemplates"
              :key="item.id"
              class="template-card"
              :class="{ active: selectedTemplateId === item.id }"
              type="button"
              @click="applyPromptTemplate(item)"
            >
              <strong>{{ item.title }}</strong>
              <span>{{ item.category }}</span>
            </button>
          </div>
          <button class="mini-action secondary full-width" type="button" @click="createTemplateWorkflow">
            {{ copy.createWorkflow }}
          </button>
        </div>

        <div v-if="selectedNode" class="panel-section">
          <h2>{{ copy.selected }}</h2>
          <label class="field">
            <span>{{ copy.name }}</span>
            <input v-model.trim="selectedNode.title" @change="saveBoard" />
          </label>
          <label class="field">
            <span>{{ copy.content }}</span>
            <textarea
              v-model="selectedNode.content"
              :readonly="selectedNode.kind === 'output' && Boolean(outputImageSrc(selectedNode))"
              :placeholder="selectedNode.kind === 'image' ? copy.imagePlaceholder : copy.promptPlaceholder"
              @change="saveBoard"
            ></textarea>
          </label>
          <label v-if="selectedNode.kind === 'image'" class="upload-drop">
            <input type="file" accept="image/png,image/jpeg,image/webp" @change="handleReferenceFile(selectedNode, $event)" />
            <span>{{ selectedNode.referenceImageName || copy.uploadReference }}</span>
          </label>
          <label v-if="selectedNode.kind === 'video' || selectedNode.kind === 'audio'" class="upload-drop">
            <input :accept="selectedNode.kind === 'video' ? 'video/*' : 'audio/*'" type="file" @change="handleMediaFile(selectedNode, $event)" />
            <span>{{ selectedNode.mediaName || copy.uploadMedia }}</span>
          </label>
          <button v-if="(selectedNode.kind === 'video' || selectedNode.kind === 'audio') && selectedNode.mediaUrl" class="mini-action secondary full-width" type="button" @click="clearMedia(selectedNode)">
            {{ copy.removeMedia }}
          </button>
          <div v-if="selectedNode.kind === 'image' && referenceImageSrc(selectedNode)" class="inspector-preview">
            <img :src="referenceImageSrc(selectedNode)" :alt="selectedNode.title" @click="openImagePreview(selectedNode)" />
            <button class="mini-action secondary" type="button" @click="clearReferenceImage(selectedNode)">
              {{ copy.removeImage }}
            </button>
            <button class="mini-action secondary" type="button" @click="openMaskEditor(selectedNode)">
              {{ copy.editMask }}
            </button>
          </div>
          <label v-if="selectedNode.kind === 'image'" class="upload-drop">
            <input type="file" accept="image/png,image/jpeg,image/webp" @change="handleMaskFile(selectedNode, $event)" />
            <span>{{ selectedNode.maskImageName || copy.uploadMask }}</span>
          </label>
          <div v-if="selectedNode.kind === 'image' && selectedNode.maskImage" class="inspector-preview">
            <img :src="selectedNode.maskImage" :alt="copy.maskImage" @click="openImagePreview(selectedNode, selectedNode.maskImage)" />
            <button class="mini-action secondary" type="button" @click="clearMaskImage(selectedNode)">
              {{ copy.removeMask }}
            </button>
          </div>
          <div v-if="selectedNode.kind === 'output' && outputImageSrc(selectedNode)" class="inspector-actions">
            <button class="mini-action secondary" type="button" :disabled="downloadingNodeId === selectedNode.id" @click="copyImage(selectedNode)">
              {{ copy.copyImage }}
            </button>
            <button class="mini-action secondary" type="button" :disabled="downloadingNodeId === selectedNode.id" @click="downloadImage(selectedNode)">
              {{ downloadingNodeId === selectedNode.id ? copy.downloading : copy.download }}
            </button>
            <button class="mini-action secondary" type="button" @click="makeReferenceFromOutput(selectedNode)">
              {{ copy.useAsReference }}
            </button>
          </div>
          <div v-if="selectedNode.kind === 'output' && outputImageSrc(selectedNode)" class="quick-actions">
            <button v-for="action in quickActions" :key="action.id" class="mini-action secondary" type="button" @click="createRemixPrompt(selectedNode, action)">
              {{ action.title }}
            </button>
          </div>
          <button v-if="selectedNode.kind === 'prompt'" class="mini-action secondary full-width" type="button" :disabled="running" @click="runVariantSet(selectedNode)">
            {{ copy.runVariants }}
          </button>
        </div>

        <div v-if="recentOutputs.length" class="panel-section">
          <h2>{{ copy.library }}</h2>
          <div class="library-grid">
            <button v-for="item in recentOutputs" :key="item.id" class="library-item" type="button" :title="item.title" @click="restoreHistoryItem(item)">
              <img :src="item.imageUrl" :alt="item.title" />
              <span>{{ item.title }}</span>
            </button>
          </div>
          <button v-if="recentOutputs[0]" class="mini-action secondary full-width" type="button" @click="restoreHistoryParams(recentOutputs[0])">
            {{ copy.restoreParams }}
          </button>
          <button class="mini-action secondary full-width" type="button" @click="clearHistory">
            {{ copy.clearLibrary }}
          </button>
        </div>

        <div v-if="downloadableNodes.length" class="panel-section">
          <h2>{{ copy.compare }}</h2>
          <div class="compare-grid">
            <button v-for="node in downloadableNodes" :key="node.id" class="compare-item" type="button" :title="node.title" @click="openImagePreview(node)">
              <img :src="outputImageSrc(node)" :alt="node.title" />
            </button>
          </div>
        </div>

        <div class="panel-section">
          <h2>{{ copy.status }}</h2>
          <label class="field">
            <span>画布外观</span>
            <select v-model="canvasPattern" @change="saveBoard">
              <option value="grid">网格</option>
              <option value="dots">点阵</option>
              <option value="plain">纯色</option>
            </select>
          </label>
          <div class="status-line">
            <span>{{ copy.zoom }}</span>
            <strong>{{ Math.round(transform.scale * 100) }}%</strong>
          </div>
          <div class="status-line">
            <span>{{ copy.nodes }}</span>
            <strong>{{ nodes.length }}</strong>
          </div>
          <div class="status-line">
            <span>{{ copy.edges }}</span>
            <strong>{{ edges.length }}</strong>
          </div>
          <button v-if="selectedEdgeId" class="mini-action secondary full-width" type="button" @click="deleteSelectedEdge">
            {{ copy.deleteEdge }}
          </button>
          <p v-if="message" class="message" :class="{ error: messageType === 'error' }">{{ message }}</p>
        </div>
      </aside>

      <div v-if="contextMenu.visible" class="context-menu" :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }">
        <button v-if="contextNodeValue?.kind === 'prompt'" type="button" @click="runContextNode">{{ copy.run }}</button>
        <button type="button" @click="duplicateContextNode">{{ copy.duplicateNode }}</button>
        <button v-if="contextNodeImageSrc" type="button" @click="referenceContextNode">{{ copy.useAsReference }}</button>
        <button v-if="contextNodeImageSrc" type="button" @click="downloadContextNode">{{ copy.download }}</button>
        <button type="button" class="danger" @click="deleteContextNode">{{ copy.deleteNode }}</button>
      </div>

      <div v-if="promptPreview" class="modal-backdrop" @click.self="promptPreview = ''">
        <section class="canvas-modal">
          <header>
            <h2>{{ copy.promptPreview }}</h2>
            <button type="button" class="node-icon-button" @click="promptPreview = ''">×</button>
          </header>
          <textarea readonly :value="promptPreview"></textarea>
          <button class="mini-action secondary full-width" type="button" @click="copyPromptPreview">{{ copy.copyPrompt }}</button>
        </section>
      </div>

      <div v-if="previewImage" class="modal-backdrop image-modal-backdrop" @click.self="previewImage = null">
        <section class="image-modal">
          <header>
            <h2>{{ previewImage.title }}</h2>
            <button type="button" class="node-icon-button" @click="previewImage = null">×</button>
          </header>
          <img :src="previewImage.src" :alt="previewImage.title" />
        </section>
      </div>

      <div v-if="maskEditor" class="modal-backdrop" @click.self="closeMaskEditor">
        <section class="mask-modal">
          <header>
            <div>
              <h2>{{ copy.maskEditor }}</h2>
              <p>{{ copy.maskEditorHint }}</p>
            </div>
            <button type="button" class="node-icon-button" @click="closeMaskEditor">×</button>
          </header>
          <div class="mask-controls">
            <label class="field">
              <span>{{ copy.brushSize }}</span>
              <input v-model.number="maskBrushSize" type="range" min="8" max="96" step="2" />
            </label>
            <label class="field checkbox-field">
              <input v-model="maskEraseMode" type="checkbox" />
              <span>{{ copy.eraser }}</span>
            </label>
          </div>
          <div class="mask-stage" :style="{ aspectRatio: maskStageAspect }">
            <img :src="maskEditor.imageSrc" :alt="maskEditor.title" />
            <canvas
              ref="maskCanvasRef"
              @pointerdown.prevent="startMaskPaint"
              @pointermove.prevent="paintMask"
              @pointerup.prevent="stopMaskPaint"
              @pointerleave.prevent="stopMaskPaint"
            ></canvas>
          </div>
          <div class="mask-actions">
            <button class="mini-action secondary" type="button" @click="clearMaskCanvas">{{ copy.clearMask }}</button>
            <button class="mini-action secondary" type="button" @click="saveMaskFromEditor">{{ copy.saveMask }}</button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { buildGatewayUrl } from '@/api/client'
import { keysAPI } from '@/api/keys'
import type { ApiKey } from '@/types'
import { canvasStorage, makeId as makeStorageId, type CanvasRecord } from './canvas/storage'

type NodeKind = 'prompt' | 'image' | 'video' | 'audio' | 'output'

interface PromptTemplate {
  id: string
  title: string
  category: string
  system: string
  prompt: string
}

interface QuickAction {
  id: string
  title: string
  prompt: string
}

interface CanvasNode {
  id: string
  kind: NodeKind
  title: string
  content: string
  imageUrl?: string
  imageMime?: string
  referenceImage?: string
  referenceImageName?: string
  maskImage?: string
  maskImageName?: string
  mediaUrl?: string
  mediaName?: string
  x: number
  y: number
}

interface CanvasEdge {
  id: string
  from: string
  to: string
}

interface RecentOutput {
  id: string
  title: string
  content: string
  imageUrl: string
  imageMime: string
  model: string
  size: string
  quality: string
  format: string
  createdAt: string
}

interface GeneratedImageResult {
  imageUrl: string
  imageMime: string
  revisedPrompt?: string
}

interface SizeChoice {
  value: (typeof imageSizes)[number]
  label: string
  description: string
  tier: '1K' | '2K' | '4K'
  price: string
  icon: 'auto' | 'square' | 'portrait' | 'landscape'
}

interface QualityChoice {
  value: (typeof imageQualities)[number]
  label: string
  description: string
  meta: string
}

interface BoardState {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  transform: { x: number; y: number; scale: number }
  model: (typeof imageModels)[number]
  imageSize: (typeof imageSizes)[number]
  imageQuality: (typeof imageQualities)[number]
  outputFormat: (typeof outputFormats)[number]
  imageCount: (typeof imageCounts)[number]
  confirmBeforeRun: boolean
  systemPrompt: string
  sizePanelOpen: boolean
  qualityPanelOpen: boolean
  canvasPattern: CanvasPattern
}

type CanvasPattern = 'grid' | 'dots' | 'plain'

const HISTORY_STORAGE_KEY = 'jkapi_canvas_history_v1'
const SELECTED_API_KEY_STORAGE_KEY = 'jkapi_canvas_selected_api_key'
const NODE_WIDTH = 280
const NODE_HEIGHT = 214
const MAX_HISTORY_ITEMS = 8

const { locale } = useI18n()
const viewportRef = ref<HTMLElement | null>(null)
const importInputRef = ref<HTMLInputElement | null>(null)
const maskCanvasRef = ref<HTMLCanvasElement | null>(null)
const nodes = ref<CanvasNode[]>([])
const edges = ref<CanvasEdge[]>([])
const recentOutputs = ref<RecentOutput[]>([])
const draggingFile = ref(false)
const selectedNodeId = ref<string | null>(null)
const selectedEdgeId = ref<string | null>(null)
const pendingSourceId = ref<string | null>(null)
const connectMode = ref(false)
const running = ref(false)
const downloadingNodeId = ref<string | null>(null)
const message = ref('')
const messageType = ref<'info' | 'error'>('info')
const imageModels = ['gpt-image-2', 'gpt-image-1.5', 'gpt-image-1'] as const
const imageSizes = ['1024x1024', '1536x1024', '1024x1536', 'auto'] as const
const imageQualities = ['auto', 'low', 'medium', 'high'] as const
const outputFormats = ['png', 'jpeg', 'webp'] as const
const imageCounts = [1, 2, 3, 4] as const
const model = ref<(typeof imageModels)[number]>('gpt-image-2')
const imageSize = ref<(typeof imageSizes)[number]>('1024x1024')
const imageQuality = ref<(typeof imageQualities)[number]>('auto')
const outputFormat = ref<(typeof outputFormats)[number]>('png')
const imageCount = ref<(typeof imageCounts)[number]>(1)
const confirmBeforeRun = ref(true)
const sizePanelOpen = ref(false)
const qualityPanelOpen = ref(false)
const apiKeys = ref<ApiKey[]>([])
const loadingKeys = ref(false)
const selectedApiKeyId = ref('')
const manualApiKey = ref('')
const systemPrompt = ref('You are a helpful assistant.')
const transform = reactive({ x: 120, y: 72, scale: 1 })
const undoStack = ref<BoardState[]>([])
const redoStack = ref<BoardState[]>([])
const activeCanvasId = ref('')
const canvasPattern = ref<CanvasPattern>('grid')
const promptPreview = ref('')
const previewImage = ref<{ src: string; title: string } | null>(null)
const maskEditor = ref<{ nodeId: string; imageSrc: string; title: string } | null>(null)
const selectedTemplateId = ref('commercial')
const maskBrushSize = ref(34)
const maskEraseMode = ref(false)
const maskStageAspect = ref('1 / 1')
const contextMenu = reactive({ visible: false, nodeId: '', x: 0, y: 0 })

let maskPainting = false

let dragState:
  | { type: 'node'; id: string; startX: number; startY: number; nodeX: number; nodeY: number }
  | { type: 'pan'; startX: number; startY: number; x: number; y: number }
  | null = null

const zhCopy = {
  title: 'JKAI 画布',
  subtitle: '把想法拆成节点，连起来生成和整理内容。',
  addPrompt: '添加文本节点',
  addImage: '添加图片节点',
  addVideo: '添加视频节点',
  addAudio: '添加音频节点',
  addOutput: '添加结果节点',
  connect: '连接节点',
  fit: '适配视图',
  zoomIn: '放大',
  zoomOut: '缩小',
  save: '保存画布',
  autoLayout: '自动整理',
  exportBoard: '导出画布',
  importBoard: '导入画布',
  clear: '清空画布',
  model: '模型',
  run: '运行',
  running: '运行中',
  runShort: '运行',
  inspector: '画布设置',
  selected: '当前节点',
  apiKey: 'API Key',
  imageLine: 'GPT Image 专线',
  imageLineHint: '选择专门用于生图的分组与密钥',
  sizeHint: '按画面比例选择，系统会自动匹配计费档位',
  qualityHint: '质量参数会发送给模型，费用以尺寸计费档为准',
  billingTier: '计费档',
  perImage: '/ 张',
  system: '图片风格提示',
  name: '名称',
  content: '内容',
  status: '状态',
  zoom: '缩放',
  nodes: '节点',
  edges: '连线',
  promptNode: '文本',
  imageNode: '图片',
  videoNode: '视频',
  audioNode: '音频',
  outputNode: '结果',
  deleteNode: '删除节点',
  saved: '已保存',
  cleared: '已清空',
  keyRequired: '请先填写 API Key',
  nodeRequired: '请选择一个文本节点',
  runDone: '生成完成',
  runFailed: '生成失败',
  noImageInResponse: '上游返回成功，但没有可识别的图片字段。请检查上游是否兼容 OpenAI 图片接口，或换一个生图上游后重试。',
  imageUrl: '图片地址',
  imageBase64: '图片 Base64',
  loadingKeys: '正在加载密钥',
  manualKey: '手动填写 API Key',
  noGroup: '未分组',
  size: '尺寸',
  quality: '质量',
  format: '格式',
  estimate: '预计单张',
  estimateTotal: '预计总价',
  unknownPrice: '按实际计费',
  copyImage: '复制',
  download: '下载',
  downloadAll: '下载全部结果',
  promptPreview: '提示词预览',
  copyPrompt: '复制提示词',
  promptCopied: '提示词已复制',
  exportPng: '导出画布 PNG',
  exportedPng: 'PNG 已导出',
  previewImage: '预览图片',
  compare: '结果对比',
  restoreParams: '恢复最近参数',
  paramsRestored: '参数已恢复',
  undone: '已撤销',
  nothingToUndo: '没有可撤销的操作',
  copied: '已复制',
  downloaded: '已开始下载',
  downloadFailed: '旧图片链接受跨域限制，无法直接下载。请重新生成一次，新结果会支持直接下载。',
  downloading: '下载中',
  generatedImage: '图片已生成',
  promptPlaceholder: '输入要生成的画面描述',
  imagePlaceholder: '粘贴参考图地址，或写图片备注。多个图片地址可换行。',
  duplicateNode: '复制节点',
  deleteEdge: '删除连线',
  noImageKey: '没有找到生图组 API Key，可先手动填写',
  count: '张数',
  confirmCost: '运行前确认',
  confirmRun: '本次预计费用为 {price}，是否继续生成？',
  referenceImage: '参考图',
  uploadReference: '上传参考图',
  removeImage: '移除图片',
  uploadMedia: '上传媒体文件',
  removeMedia: '移除媒体文件',
  uploadMask: '上传蒙版图',
  editMask: '编辑蒙版',
  maskEditor: '局部重绘蒙版',
  maskEditorHint: '直接在图片上涂抹需要修改的区域，保存后运行会自动带上蒙版。',
  brushSize: '画笔大小',
  eraser: '橡皮擦',
  clearMask: '清空蒙版',
  saveMask: '保存蒙版',
  maskSaved: '蒙版已保存',
  maskImage: '蒙版图',
  removeMask: '移除蒙版',
  templates: '模板库',
  createWorkflow: '生成模板工作流',
  templateApplied: '模板已应用',
  workflowCreated: '工作流已创建',
  runVariants: '生成 4 个变体',
  variantsConfirm: '将按 4 个风格方向各生成 1 张图，预计约为当前单张价格的 4 倍，是否继续？',
  variantsDone: '4 个变体已生成',
  remixCreated: '二创节点已创建',
  commercial: '商业海报',
  portrait: '头像写真',
  product: '商品精修',
  cover: '封面配图',
  interior: '室内设计',
  logo: '品牌 Logo',
  morePremium: '更高级',
  moreRealistic: '更写实',
  changeBackground: '换背景',
  sameStyle: '生成同款',
  improveDetails: '放大细节',
  useAsReference: '设为参考',
  referenceCreated: '已生成参考图节点',
  dropImage: '松开后添加图片节点',
  imageAdded: '图片已添加',
  noDownloadableImages: '当前画布没有可下载的结果图',
  networkError: '网络连接失败，请稍后重试。',
  quotaError: '余额或额度不足，请检查余额、分组额度或上游额度。',
  authError: 'API Key 无效或没有权限，请检查密钥和分组。',
  rateLimitError: '请求太频繁或上游限流，请稍后重试。',
  contentPolicyError: '内容被上游安全策略拦截，请调整提示词。',
  unsupportedReference: '图片链接已加入提示词；如需图生图，请上传本地图片或连接已生成的结果节点。',
  library: '作品库',
  clearLibrary: '清空作品库',
  historyRestored: '已放回画布',
  importDone: '导入完成',
  importFailed: '导入失败',
  exportDone: '已导出',
  saveTooLarge: '画布内容过大，已保留当前操作，但本地保存可能失败。建议导出画布备份。',
  confirmUnavailablePrice: '本次费用会按实际计费，是否继续生成？',
}

const enCopy = {
  title: 'JKAI Canvas',
  subtitle: 'Break ideas into nodes, connect them, and generate drafts.',
  addPrompt: 'Add text node',
  addImage: 'Add image node',
  addVideo: 'Add video node',
  addAudio: 'Add audio node',
  addOutput: 'Add output node',
  connect: 'Connect nodes',
  fit: 'Fit view',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  save: 'Save canvas',
  autoLayout: 'Auto arrange',
  exportBoard: 'Export board',
  importBoard: 'Import board',
  clear: 'Clear canvas',
  model: 'Model',
  run: 'Run',
  running: 'Running',
  runShort: 'Run',
  inspector: 'Canvas Settings',
  selected: 'Selected Node',
  apiKey: 'API Key',
  imageLine: 'GPT Image Line',
  imageLineHint: 'Choose a group and key dedicated to image generation',
  sizeHint: 'Choose the canvas ratio; billing tier is resolved automatically',
  qualityHint: 'Quality is sent to the model; billing follows the size tier',
  billingTier: 'Billing',
  perImage: '/ image',
  system: 'Image Style Prompt',
  name: 'Name',
  content: 'Content',
  status: 'Status',
  zoom: 'Zoom',
  nodes: 'Nodes',
  edges: 'Edges',
  promptNode: 'Text',
  imageNode: 'Image',
  videoNode: 'Video',
  audioNode: 'Audio',
  outputNode: 'Output',
  deleteNode: 'Delete node',
  saved: 'Saved',
  cleared: 'Cleared',
  keyRequired: 'Enter an API Key first',
  nodeRequired: 'Select a text node',
  runDone: 'Generated',
  runFailed: 'Generation failed',
  noImageInResponse: 'The upstream returned success, but no image field was recognized. Check whether the upstream is compatible with the OpenAI image API or try another image upstream.',
  imageUrl: 'Image URL',
  imageBase64: 'Image Base64',
  loadingKeys: 'Loading keys',
  manualKey: 'Enter API Key manually',
  noGroup: 'No group',
  size: 'Size',
  quality: 'Quality',
  format: 'Format',
  estimate: 'Est. per image',
  estimateTotal: 'Est. total',
  unknownPrice: 'Actual billing',
  copyImage: 'Copy',
  download: 'Download',
  downloadAll: 'Download all outputs',
  promptPreview: 'Prompt preview',
  copyPrompt: 'Copy prompt',
  promptCopied: 'Prompt copied',
  exportPng: 'Export canvas PNG',
  exportedPng: 'PNG exported',
  previewImage: 'Preview image',
  compare: 'Compare',
  restoreParams: 'Restore latest params',
  paramsRestored: 'Params restored',
  undone: 'Undone',
  nothingToUndo: 'Nothing to undo',
  copied: 'Copied',
  downloaded: 'Download started',
  downloadFailed: 'This older image URL is blocked by cross-origin rules. Regenerate it to enable direct download.',
  downloading: 'Downloading',
  generatedImage: 'Image generated',
  promptPlaceholder: 'Describe the image you want to generate',
  imagePlaceholder: 'Paste reference image URLs or notes. One image URL per line.',
  duplicateNode: 'Duplicate node',
  deleteEdge: 'Delete edge',
  noImageKey: 'No image API key found; enter one manually',
  count: 'Images',
  confirmCost: 'Confirm before run',
  confirmRun: 'Estimated cost is {price}. Continue?',
  referenceImage: 'Reference image',
  uploadReference: 'Upload reference image',
  removeImage: 'Remove image',
  uploadMedia: 'Upload media file',
  removeMedia: 'Remove media file',
  uploadMask: 'Upload mask image',
  editMask: 'Edit mask',
  maskEditor: 'Inpaint mask',
  maskEditorHint: 'Paint the area to edit. Saved masks are sent with the next image edit request.',
  brushSize: 'Brush size',
  eraser: 'Eraser',
  clearMask: 'Clear mask',
  saveMask: 'Save mask',
  maskSaved: 'Mask saved',
  maskImage: 'Mask image',
  removeMask: 'Remove mask',
  templates: 'Templates',
  createWorkflow: 'Create template workflow',
  templateApplied: 'Template applied',
  workflowCreated: 'Workflow created',
  runVariants: 'Generate 4 variants',
  variantsConfirm: 'This will generate 1 image for each of 4 style directions. Estimated cost is about 4x the current single image price. Continue?',
  variantsDone: '4 variants generated',
  remixCreated: 'Remix node created',
  commercial: 'Commercial poster',
  portrait: 'Portrait',
  product: 'Product retouch',
  cover: 'Cover art',
  interior: 'Interior',
  logo: 'Brand logo',
  morePremium: 'More premium',
  moreRealistic: 'More realistic',
  changeBackground: 'Change background',
  sameStyle: 'Same style',
  improveDetails: 'Improve details',
  useAsReference: 'Use as reference',
  referenceCreated: 'Reference node created',
  dropImage: 'Drop to add an image node',
  imageAdded: 'Image added',
  noDownloadableImages: 'No downloadable output images on this canvas',
  networkError: 'Network request failed. Try again later.',
  quotaError: 'Balance or quota is insufficient. Check balance, group quota, or upstream quota.',
  authError: 'API Key is invalid or unauthorized. Check the key and group.',
  rateLimitError: 'Too many requests or upstream rate limit. Try again later.',
  contentPolicyError: 'The upstream safety policy blocked this prompt. Adjust the prompt and retry.',
  unsupportedReference: 'Image links were added to the prompt. Upload a local image or connect a generated output for image-to-image.',
  library: 'Library',
  clearLibrary: 'Clear library',
  historyRestored: 'Restored to canvas',
  importDone: 'Imported',
  importFailed: 'Import failed',
  exportDone: 'Exported',
  saveTooLarge: 'Canvas is too large to save locally. Export a backup if needed.',
  confirmUnavailablePrice: 'This run will use actual billing. Continue?',
}

const copy = computed(() => (String(locale.value).startsWith('zh') ? zhCopy : enCopy))
const selectedNode = computed(() => nodes.value.find((node) => node.id === selectedNodeId.value) || null)
const selectedPromptNode = computed(() => (selectedNode.value?.kind === 'prompt' ? selectedNode.value : null))
const downloadableNodes = computed(() => nodes.value.filter((node) => node.kind === 'output' && outputImageSrc(node)))
const contextNodeValue = computed(() => nodes.value.find((node) => node.id === contextMenu.nodeId) || null)
const contextNodeImageSrc = computed(() => {
  const node = contextNodeValue.value
  return node ? outputImageSrc(node) || referenceImageSrc(node) : ''
})
const selectedApiKey = computed(() => apiKeys.value.find((key) => String(key.id) === selectedApiKeyId.value) || null)
const imageApiKeys = computed(() =>
  apiKeys.value.filter((key) => {
    if (key.status !== 'active') return false
    const groupName = key.group?.name?.toLowerCase() || ''
    const keyName = key.name.toLowerCase()
    return key.group?.allow_image_generation || groupName.includes('生图') || keyName.includes('生图') || keyName.includes('画布')
  }),
)
const effectiveApiKey = computed(() => selectedApiKey.value?.key || manualApiKey.value)
const estimatedPrice = computed(() => {
  const base = imageUnitPriceForTier(imageBillingTierForSize(imageSize.value))
  if (typeof base !== 'number') return copy.value.unknownPrice
  const multiplier = imageRateMultiplier()
  return `$${(base * (multiplier || 1) * imageCount.value).toFixed(5)}`
})
const sizeOptions = computed<SizeChoice[]>(() => {
  const zh = String(locale.value).startsWith('zh')
  return [
    {
      value: 'auto',
      label: zh ? '自适应' : 'Auto',
      description: zh ? '由模型按画面内容自动决定' : 'Let the model choose from the prompt',
      tier: '2K',
      price: imageTierPriceLabel('2K'),
      icon: 'auto',
    },
    {
      value: '1024x1024',
      label: zh ? '正方形 (1:1)' : 'Square (1:1)',
      description: zh ? '适合头像、产品和图标' : 'Best for avatars, products, and icons',
      tier: '1K',
      price: imageTierPriceLabel('1K'),
      icon: 'square',
    },
    {
      value: '1024x1536',
      label: zh ? '竖版 (2:3)' : 'Portrait (2:3)',
      description: zh ? '适合人物、海报与移动端内容' : 'Best for portraits, posters, and mobile content',
      tier: '2K',
      price: imageTierPriceLabel('2K'),
      icon: 'portrait',
    },
    {
      value: '1536x1024',
      label: zh ? '横版 (3:2)' : 'Landscape (3:2)',
      description: zh ? '适合场景、封面与横向构图' : 'Best for scenes, covers, and wide compositions',
      tier: '2K',
      price: imageTierPriceLabel('2K'),
      icon: 'landscape',
    },
  ]
})
const qualityOptions = computed<QualityChoice[]>(() => {
  const zh = String(locale.value).startsWith('zh')
  return [
    {
      value: 'auto',
      label: zh ? '自适应' : 'Auto',
      description: zh ? '由模型自动平衡质量与速度' : 'Model balances quality and speed',
      meta: zh ? '推荐默认' : 'Recommended default',
    },
    {
      value: 'high',
      label: zh ? '高' : 'High',
      description: zh ? '细节更强，适合成片和正式交付' : 'More detail for final delivery',
      meta: zh ? '高质量优先' : 'Quality first',
    },
    {
      value: 'medium',
      label: zh ? '中' : 'Medium',
      description: zh ? '平衡细节与速度' : 'Balanced detail and speed',
      meta: zh ? '均衡模式' : 'Balanced mode',
    },
    {
      value: 'low',
      label: zh ? '低' : 'Low',
      description: zh ? '适合快速探索和草稿' : 'Fast drafts and exploration',
      meta: zh ? '速度优先' : 'Speed first',
    },
  ]
})
const selectedSizeOption = computed(() => sizeOptions.value.find((option) => option.value === imageSize.value) || sizeOptions.value[0])
const selectedQualityOption = computed(() => qualityOptions.value.find((option) => option.value === imageQuality.value) || qualityOptions.value[0])
const boardStyle = computed(() => ({
  transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
}))

function minimapNodeStyle(node: CanvasNode) {
  const xs = nodes.value.map((item) => item.x)
  const ys = nodes.value.map((item) => item.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const width = Math.max(1, Math.max(...xs) - minX + NODE_WIDTH)
  const height = Math.max(1, Math.max(...ys) - minY + NODE_HEIGHT)
  return {
    left: `${Math.max(4, Math.min(112, ((node.x - minX) / width) * 112 + 4))}px`,
    top: `${Math.max(4, Math.min(70, ((node.y - minY) / height) * 70 + 4))}px`,
  }
}

const promptTemplates = computed<PromptTemplate[]>(() => [
  {
    id: 'commercial',
    title: copy.value.commercial,
    category: 'Poster',
    system: '你是一名资深商业视觉设计师，输出适合投放和转化的高质量画面。',
    prompt: '生成一张高转化商业海报：主体清晰，留出标题区域，画面干净高级，强光影层次，适合社媒投放，中文排版空间充足。',
  },
  {
    id: 'portrait',
    title: copy.value.portrait,
    category: 'Portrait',
    system: '你是一名商业摄影修图师，擅长真实自然的人像质感。',
    prompt: '生成一张高级人像写真：自然肤色，真实镜头质感，干净背景，柔和光线，面部细节清晰，整体风格高级克制。',
  },
  {
    id: 'product',
    title: copy.value.product,
    category: 'Product',
    system: '你是一名电商产品视觉设计师，擅长让商品更高级、更清晰、更有购买欲。',
    prompt: '生成一张商品精修图：主体居中，材质细节清楚，背景干净，有高级商业摄影光效，可用于商品详情页和广告图。',
  },
  {
    id: 'cover',
    title: copy.value.cover,
    category: 'Cover',
    system: '你是一名内容封面设计师，擅长强点击率的视觉构图。',
    prompt: '生成一张内容封面图：主体醒目，构图有冲击力，预留标题文字区域，色彩有辨识度，适合公众号、小红书或视频封面。',
  },
  {
    id: 'interior',
    title: copy.value.interior,
    category: 'Interior',
    system: '你是一名室内空间视觉设计师，注重真实材质、光线和空间比例。',
    prompt: '生成一张室内设计效果图：空间通透，真实材质，柔和自然光，现代高级风格，家具比例合理，整体干净舒适。',
  },
  {
    id: 'logo',
    title: copy.value.logo,
    category: 'Brand',
    system: '你是一名品牌视觉设计师，擅长简洁、可识别、可落地的标志设计。',
    prompt: '生成一组品牌 Logo 视觉方案：简洁高级，识别度强，适合深浅背景，避免复杂细碎元素，具有现代科技感。',
  },
])
const selectedTemplate = computed(() => promptTemplates.value.find((template) => template.id === selectedTemplateId.value) || promptTemplates.value[0])

const quickActions = computed<QuickAction[]>(() => [
  { id: 'premium', title: copy.value.morePremium, prompt: '在保留主体和构图的基础上，让画面更高级、更商业化，提升质感、光影、构图和细节。' },
  { id: 'realistic', title: copy.value.moreRealistic, prompt: '在保留主体和构图的基础上，提高真实摄影质感，减少 AI 痕迹，增强材质、光线和细节可信度。' },
  { id: 'background', title: copy.value.changeBackground, prompt: '保留主体不变，替换为更适合商业展示的干净高级背景，主体边缘自然融合。' },
  { id: 'same', title: copy.value.sameStyle, prompt: '参考这张图的构图、色彩、光影和整体风格，生成同款风格的新画面。' },
  { id: 'details', title: copy.value.improveDetails, prompt: '保留整体画面，提升细节清晰度、材质层次和局部精致度，避免过度锐化。' },
])

const variantPrompts = computed(() => [
  { title: copy.value.morePremium, prompt: '方向一：更高级、更商业、更适合投放，整体质感提升。' },
  { title: copy.value.moreRealistic, prompt: '方向二：更写实、更像真实摄影，减少 AI 感。' },
  { title: copy.value.changeBackground, prompt: '方向三：更换为更干净高级的背景，主体保持清晰突出。' },
  { title: copy.value.sameStyle, prompt: '方向四：保留核心风格，但给出新的构图和视觉变化。' },
])

function currentBoardState(): BoardState {
  return {
    nodes: structuredClone(nodes.value),
    edges: structuredClone(edges.value),
    transform: { ...transform },
    model: model.value,
    imageSize: imageSize.value,
    imageQuality: imageQuality.value,
    outputFormat: outputFormat.value,
    imageCount: imageCount.value,
    confirmBeforeRun: confirmBeforeRun.value,
    systemPrompt: systemPrompt.value,
    sizePanelOpen: sizePanelOpen.value,
    qualityPanelOpen: qualityPanelOpen.value,
    canvasPattern: canvasPattern.value,
  }
}

function rememberBoard() {
  undoStack.value.push(currentBoardState())
  if (undoStack.value.length > 30) undoStack.value.shift()
  redoStack.value = []
}

function restoreBoardState(state: BoardState) {
  nodes.value = structuredClone(state.nodes)
  edges.value = structuredClone(state.edges)
  transform.x = state.transform.x
  transform.y = state.transform.y
  transform.scale = state.transform.scale
  model.value = state.model
  imageSize.value = state.imageSize
  imageQuality.value = state.imageQuality
  outputFormat.value = state.outputFormat
  imageCount.value = state.imageCount
  confirmBeforeRun.value = state.confirmBeforeRun
  systemPrompt.value = state.systemPrompt
  sizePanelOpen.value = state.sizePanelOpen
  qualityPanelOpen.value = state.qualityPanelOpen
  canvasPattern.value = state.canvasPattern || 'grid'
}

function undoBoard() {
  const state = undoStack.value.pop()
  if (!state) {
    setMessage(copy.value.nothingToUndo, 'error')
    return
  }
  redoStack.value.push(currentBoardState())
  restoreBoardState(state)
  saveBoard()
  setMessage(copy.value.undone, 'info')
}

function redoBoard() {
  const state = redoStack.value.pop()
  if (!state) return
  undoStack.value.push(currentBoardState())
  restoreBoardState(state)
  saveBoard()
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

function nodeLabel(kind: NodeKind) {
  if (kind === 'image') return copy.value.imageNode
  if (kind === 'video') return copy.value.videoNode
  if (kind === 'audio') return copy.value.audioNode
  if (kind === 'output') return copy.value.outputNode
  return copy.value.promptNode
}

function buildPrompt(node: CanvasNode) {
  const context = getIncomingText(node.id)
  return [systemPrompt.value, context, node.content].filter(Boolean).join('\n\n')
}

function openPromptPreview() {
  if (!selectedPromptNode.value) return
  promptPreview.value = buildPrompt(selectedPromptNode.value)
}

async function copyPromptPreview() {
  await navigator.clipboard?.writeText(promptPreview.value)
  setMessage(copy.value.promptCopied, 'info')
}

function openImagePreview(node: CanvasNode, src = outputImageSrc(node) || referenceImageSrc(node)) {
  if (!src) return
  previewImage.value = { src, title: node.title || copy.value.previewImage }
}

function openNodeMenu(id: string, event: MouseEvent) {
  selectedNodeId.value = id
  selectedEdgeId.value = null
  contextMenu.visible = true
  contextMenu.nodeId = id
  contextMenu.x = event.clientX
  contextMenu.y = event.clientY
}

function closeContextMenu() {
  contextMenu.visible = false
}

function contextNode() {
  return contextNodeValue.value
}

function duplicateContextNode() {
  const node = contextNode()
  closeContextMenu()
  if (node) duplicateNode(node.id)
}

function deleteContextNode() {
  const node = contextNode()
  closeContextMenu()
  if (node) deleteNode(node.id)
}

function runContextNode() {
  const node = contextNode()
  closeContextMenu()
  if (node) void runNode(node.id)
}

function downloadContextNode() {
  const node = contextNode()
  closeContextMenu()
  if (node) void downloadImage(node)
}

function referenceContextNode() {
  const node = contextNode()
  closeContextMenu()
  if (node) makeReferenceFromOutput(node)
}

function selectApiKey(id: number | string) {
  selectedApiKeyId.value = String(id)
  persistSelectedApiKey()
}

function selectImageSize(value: (typeof imageSizes)[number]) {
  imageSize.value = value
  sizePanelOpen.value = false
  saveBoard()
}

function selectImageQuality(value: (typeof imageQualities)[number]) {
  imageQuality.value = value
  qualityPanelOpen.value = false
  saveBoard()
}

function toggleChoicePanel(panel: 'size' | 'quality') {
  if (panel === 'size') {
    sizePanelOpen.value = !sizePanelOpen.value
  } else {
    qualityPanelOpen.value = !qualityPanelOpen.value
  }
  saveBoard()
}

function imageBillingTierForSize(value: (typeof imageSizes)[number]): '1K' | '2K' | '4K' {
  if (value === '1024x1024') return '1K'
  return '2K'
}

function imageUnitPriceForTier(tier: '1K' | '2K' | '4K', key = selectedApiKey.value) {
  const group = key?.group
  if (!group) return null
  if (tier === '1K') return group.image_price_1k
  if (tier === '4K') return group.image_price_4k
  return group.image_price_2k ?? group.image_price_1k
}

function imageRateMultiplier(key = selectedApiKey.value) {
  const group = key?.group
  if (!group) return 1
  return group.image_rate_independent ? group.image_rate_multiplier : group.rate_multiplier
}

function imageTierPriceLabel(tier: '1K' | '2K' | '4K') {
  const price = imageUnitPriceForTier(tier)
  if (typeof price !== 'number') return copy.value.unknownPrice
  return `$${(price * (imageRateMultiplier() || 1)).toFixed(5)} ${copy.value.perImage}`
}

function routePriceLabel(key: ApiKey) {
  const price = imageUnitPriceForTier(imageBillingTierForSize(imageSize.value), key)
  if (typeof price !== 'number') return copy.value.unknownPrice
  return `$${(price * (imageRateMultiplier(key) || 1)).toFixed(5)} ${copy.value.perImage}`
}

function addNode(kind: NodeKind) {
  rememberBoard()
  const node: CanvasNode = {
    id: makeId('node'),
    kind,
    title: nodeLabel(kind),
    content: kind === 'image' ? 'https://...' : '',
    x: Math.round((120 - transform.x) / transform.scale) + nodes.value.length * 28,
    y: Math.round((120 - transform.y) / transform.scale) + nodes.value.length * 28,
  }
  nodes.value.push(node)
  selectedNodeId.value = node.id
  selectedEdgeId.value = null
  saveBoard()
}

function handleMediaFile(node: CanvasNode, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    rememberBoard()
    node.mediaUrl = String(reader.result || '')
    node.mediaName = file.name
    node.content = file.name
    saveBoard()
  }
  reader.readAsDataURL(file)
}

function clearMedia(node: CanvasNode) {
  rememberBoard()
  node.mediaUrl = ''
  node.mediaName = ''
  saveBoard()
}

function addImageNodeFromDataUrl(dataUrl: string, name: string, point?: { x: number; y: number }) {
  rememberBoard()
  const node: CanvasNode = {
    id: makeId('node'),
    kind: 'image',
    title: name || copy.value.referenceImage,
    content: name,
    referenceImage: dataUrl,
    referenceImageName: name,
    x: point?.x ?? Math.round((160 - transform.x) / transform.scale),
    y: point?.y ?? Math.round((160 - transform.y) / transform.scale),
  }
  nodes.value.push(node)
  selectedNodeId.value = node.id
  selectedEdgeId.value = null
  saveBoard()
  setMessage(copy.value.imageAdded, 'info')
}

function duplicateNode(id: string) {
  const source = nodes.value.find((node) => node.id === id)
  if (!source) return
  rememberBoard()
  const node: CanvasNode = {
    ...source,
    id: makeId('node'),
    title: `${source.title} Copy`,
    x: source.x + 32,
    y: source.y + 32,
  }
  nodes.value.push(node)
  selectedNodeId.value = node.id
  selectedEdgeId.value = null
  saveBoard()
}

function deleteNode(id: string) {
  rememberBoard()
  nodes.value = nodes.value.filter((node) => node.id !== id)
  edges.value = edges.value.filter((edge) => edge.from !== id && edge.to !== id)
  if (selectedNodeId.value === id) selectedNodeId.value = null
  if (pendingSourceId.value === id) pendingSourceId.value = null
  saveBoard()
}

function handleNodeClick(id: string) {
  if (connectMode.value) {
    if (!pendingSourceId.value) {
      pendingSourceId.value = id
      return
    }
    if (pendingSourceId.value !== id) {
      const exists = edges.value.some((edge) => edge.from === pendingSourceId.value && edge.to === id)
      if (!exists) {
        rememberBoard()
        edges.value.push({ id: makeId('edge'), from: pendingSourceId.value, to: id })
      }
      saveBoard()
    }
    pendingSourceId.value = null
    connectMode.value = false
    return
  }

  selectedNodeId.value = id
  selectedEdgeId.value = null
}

function toggleConnectMode() {
  connectMode.value = !connectMode.value
  pendingSourceId.value = null
}

function selectEdge(id: string) {
  selectedEdgeId.value = id
  selectedNodeId.value = null
}

function startNodeDrag(id: string, event: PointerEvent) {
  const node = nodes.value.find((item) => item.id === id)
  if (!node) return
  selectedNodeId.value = id
  selectedEdgeId.value = null
  dragState = { type: 'node', id, startX: event.clientX, startY: event.clientY, nodeX: node.x, nodeY: node.y }
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', stopPointer)
}

function startPan(event: PointerEvent) {
  if (event.button !== 0) return
  selectedNodeId.value = null
  selectedEdgeId.value = null
  dragState = { type: 'pan', startX: event.clientX, startY: event.clientY, x: transform.x, y: transform.y }
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', stopPointer)
}

function handlePointerMove(event: PointerEvent) {
  if (!dragState) return
  if (dragState.type === 'node') {
    const activeDrag = dragState
    const node = nodes.value.find((item) => item.id === activeDrag.id)
    if (!node) return
    node.x = Math.round(activeDrag.nodeX + (event.clientX - activeDrag.startX) / transform.scale)
    node.y = Math.round(activeDrag.nodeY + (event.clientY - activeDrag.startY) / transform.scale)
    return
  }
  transform.x = dragState.x + event.clientX - dragState.startX
  transform.y = dragState.y + event.clientY - dragState.startY
}

function stopPointer() {
  if (dragState?.type === 'node') saveBoard()
  dragState = null
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', stopPointer)
}

function handleWheel(event: WheelEvent) {
  const next = Math.min(1.8, Math.max(0.45, transform.scale - event.deltaY * 0.001))
  const rect = viewportRef.value?.getBoundingClientRect()
  if (!rect) {
    transform.scale = next
    return
  }
  const offsetX = event.clientX - rect.left
  const offsetY = event.clientY - rect.top
  const worldX = (offsetX - transform.x) / transform.scale
  const worldY = (offsetY - transform.y) / transform.scale
  transform.scale = next
  transform.x = offsetX - worldX * next
  transform.y = offsetY - worldY * next
}

function zoomBy(delta: number) {
  transform.scale = Math.min(1.8, Math.max(0.45, Number((transform.scale + delta).toFixed(2))))
  saveBoard()
}

function edgePath(edge: CanvasEdge) {
  const from = nodes.value.find((node) => node.id === edge.from)
  const to = nodes.value.find((node) => node.id === edge.to)
  if (!from || !to) return ''
  const x1 = from.x + NODE_WIDTH
  const y1 = from.y + NODE_HEIGHT / 2
  const x2 = to.x
  const y2 = to.y + NODE_HEIGHT / 2
  const gap = Math.max(80, Math.abs(x2 - x1) / 2)
  return `M ${x1} ${y1} C ${x1 + gap} ${y1}, ${x2 - gap} ${y2}, ${x2} ${y2}`
}

function incomingCount(id: string) {
  return edges.value.filter((edge) => edge.to === id).length
}

function outgoingCount(id: string) {
  return edges.value.filter((edge) => edge.from === id).length
}

function getIncomingText(id: string) {
  return edges.value
    .filter((edge) => edge.to === id)
    .map((edge) => nodes.value.find((node) => node.id === edge.from))
    .filter((node): node is CanvasNode => Boolean(node))
    .map((node) => `${node.title}\n${node.content || node.mediaName || ''}`)
    .join('\n\n')
}

function outputImageSrc(node: CanvasNode) {
  if (node.imageUrl) return node.imageUrl
  const content = node.content || ''
  const dataUrl = content.match(/data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/i)?.[0]
  if (dataUrl) return dataUrl
  const url = content.match(/https?:\/\/\S+/i)?.[0]
  return url || ''
}

function referenceImageSrc(node: CanvasNode) {
  if (node.referenceImage) return node.referenceImage
  if (node.kind !== 'image') return ''
  return outputImageSrc(node)
}

function clearReferenceImage(node: CanvasNode) {
  rememberBoard()
  node.referenceImage = ''
  node.referenceImageName = ''
  saveBoard()
}

function handleReferenceFile(node: CanvasNode, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    rememberBoard()
    node.referenceImage = String(reader.result || '')
    node.referenceImageName = file.name
    node.content = node.content === 'https://...' || !node.content.trim() ? file.name : node.content
    saveBoard()
  }
  reader.readAsDataURL(file)
}

function handleMaskFile(node: CanvasNode, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    rememberBoard()
    node.maskImage = String(reader.result || '')
    node.maskImageName = file.name
    saveBoard()
  }
  reader.readAsDataURL(file)
}

function clearMaskImage(node: CanvasNode) {
  rememberBoard()
  node.maskImage = ''
  node.maskImageName = ''
  saveBoard()
}

function openMaskEditor(node: CanvasNode) {
  const imageSrc = referenceImageSrc(node)
  if (!imageSrc) return
  maskEditor.value = { nodeId: node.id, imageSrc, title: node.title || copy.value.referenceImage }
  const img = new Image()
  img.onload = () => {
    const width = Math.min(900, Math.max(320, img.width))
    const height = Math.round(width * (img.height / img.width))
    maskStageAspect.value = `${img.width} / ${img.height}`
    window.requestAnimationFrame(() => {
      const canvas = maskCanvasRef.value
      if (!canvas) return
      canvas.width = width
      canvas.height = Math.max(240, height)
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    })
  }
  img.src = imageSrc
}

function closeMaskEditor() {
  maskEditor.value = null
  maskPainting = false
}

function maskPoint(event: PointerEvent) {
  const canvas = maskCanvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  }
}

function drawMaskPoint(event: PointerEvent) {
  const canvas = maskCanvasRef.value
  const point = maskPoint(event)
  if (!canvas || !point) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.globalCompositeOperation = maskEraseMode.value ? 'destination-out' : 'source-over'
  ctx.fillStyle = 'rgba(20, 184, 166, 0.55)'
  ctx.beginPath()
  ctx.arc(point.x, point.y, maskBrushSize.value / 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'
}

function startMaskPaint(event: PointerEvent) {
  maskPainting = true
  ;(event.currentTarget as HTMLCanvasElement).setPointerCapture(event.pointerId)
  drawMaskPoint(event)
}

function paintMask(event: PointerEvent) {
  if (!maskPainting) return
  drawMaskPoint(event)
}

function stopMaskPaint() {
  maskPainting = false
}

function clearMaskCanvas() {
  const canvas = maskCanvasRef.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

function saveMaskFromEditor() {
  const canvas = maskCanvasRef.value
  const editor = maskEditor.value
  if (!canvas || !editor) return
  const exportCanvas = document.createElement('canvas')
  exportCanvas.width = canvas.width
  exportCanvas.height = canvas.height
  const ctx = exportCanvas.getContext('2d')
  if (!ctx) return
  ctx.drawImage(canvas, 0, 0)
  const node = nodes.value.find((item) => item.id === editor.nodeId)
  if (!node) return
  rememberBoard()
  node.maskImage = exportCanvas.toDataURL('image/png')
  node.maskImageName = `mask-${safeFileName(node.title)}.png`
  closeMaskEditor()
  saveBoard()
  setMessage(copy.value.maskSaved, 'info')
}

function readImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error || new Error('Failed to read image'))
    reader.readAsDataURL(file)
  })
}

function viewportPoint(event: { clientX: number; clientY: number }) {
  const rect = viewportRef.value?.getBoundingClientRect()
  if (!rect) return undefined
  return {
    x: Math.round((event.clientX - rect.left - transform.x) / transform.scale),
    y: Math.round((event.clientY - rect.top - transform.y) / transform.scale),
  }
}

async function handleCanvasDrop(event: DragEvent) {
  draggingFile.value = false
  const files = Array.from(event.dataTransfer?.files || []).filter((file) => file.type.startsWith('image/'))
  if (!files.length) return
  const base = viewportPoint(event)
  for (const [index, file] of files.slice(0, 6).entries()) {
    const dataUrl = await readImageFile(file)
    addImageNodeFromDataUrl(dataUrl, file.name, base ? { x: base.x + index * 32, y: base.y + index * 32 } : undefined)
  }
}

async function handlePaste(event: ClipboardEvent) {
  const target = event.target as HTMLElement | null
  if (target?.closest('input, textarea, select')) return
  const files = Array.from(event.clipboardData?.files || []).filter((file) => file.type.startsWith('image/'))
  if (!files.length) return
  event.preventDefault()
  for (const [index, file] of files.slice(0, 4).entries()) {
    const dataUrl = await readImageFile(file)
    addImageNodeFromDataUrl(dataUrl, file.name || copy.value.referenceImage, {
      x: Math.round((180 - transform.x) / transform.scale) + index * 32,
      y: Math.round((180 - transform.y) / transform.scale) + index * 32,
    })
  }
}

async function copyImage(node: CanvasNode) {
  const src = outputImageSrc(node)
  if (!src) return
  if (src.startsWith('data:image/') && navigator.clipboard && 'ClipboardItem' in window) {
    try {
      const blob = dataUrlToBlob(src)
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ])
      setMessage(copy.value.copied, 'info')
      return
    } catch {
      // Fall back to copying the data URL.
    }
  }
  await navigator.clipboard?.writeText(src)
  setMessage(copy.value.copied, 'info')
}

function dataUrlToBlob(dataUrl: string) {
  const [meta, data] = dataUrl.split(',')
  const mime = meta.match(/data:([^;]+)/)?.[1] || 'image/png'
  const binary = atob(data || '')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

function safeFileName(value: string) {
  const name = value.trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-')
  return (name || 'jkapi-image').slice(0, 80)
}

function mimeExtension(value: string) {
  const mime = value.match(/^data:image\/([^;]+)/)?.[1] || outputFormat.value
  return mime === 'jpeg' ? 'jpg' : mime
}

function triggerDownload(url: string, filename: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

async function downloadImage(node: CanvasNode) {
  const src = outputImageSrc(node)
  if (!src) return
  downloadingNodeId.value = node.id
  const extension = (node.imageMime || `image/${outputFormat.value}`).split('/')[1] || outputFormat.value
  const filename = `${safeFileName(`${node.title}-${model.value}-${imageSize.value}-${imageQuality.value}`)}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${extension}`
  try {
    if (src.startsWith('data:image/')) {
      const blob = dataUrlToBlob(src)
      const objectUrl = URL.createObjectURL(blob)
      triggerDownload(objectUrl, filename)
      setTimeout(() => URL.revokeObjectURL(objectUrl), 3000)
      setMessage(copy.value.downloaded, 'info')
      return
    }

    const response = await fetch(src, { mode: 'cors' })
    if (!response.ok) throw new Error(response.statusText)
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    triggerDownload(objectUrl, filename)
    setTimeout(() => URL.revokeObjectURL(objectUrl), 3000)
    setMessage(copy.value.downloaded, 'info')
  } catch {
    setMessage(copy.value.downloadFailed, 'error')
  } finally {
    downloadingNodeId.value = null
  }
}

async function downloadAllOutputs() {
  const outputs = downloadableNodes.value
  if (!outputs.length) {
    setMessage(copy.value.noDownloadableImages, 'error')
    return
  }
  for (const node of outputs) {
    await downloadImage(node)
    await new Promise((resolve) => window.setTimeout(resolve, 180))
  }
}

function makeReferenceFromOutput(node: CanvasNode) {
  const src = outputImageSrc(node)
  if (!src) return
  rememberBoard()
  const reference: CanvasNode = {
    id: makeId('node'),
    kind: 'image',
    title: `${node.title} ${copy.value.referenceImage}`,
    content: node.content,
    referenceImage: src,
    referenceImageName: `${safeFileName(node.title)}.${mimeExtension(src)}`,
    x: node.x + 360,
    y: node.y,
  }
  nodes.value.push(reference)
  selectedNodeId.value = reference.id
  selectedEdgeId.value = null
  saveBoard()
  setMessage(copy.value.referenceCreated, 'info')
}

function applyPromptTemplate(template: PromptTemplate) {
  rememberBoard()
  selectedTemplateId.value = template.id
  const target = selectedNode.value?.kind === 'prompt' ? selectedNode.value : createPromptNode(template.title, '')
  target.title = template.title
  target.content = template.prompt
  systemPrompt.value = template.system
  selectedNodeId.value = target.id
  saveBoard()
  setMessage(copy.value.templateApplied, 'info')
}

function createPromptNode(title: string, content: string, point?: { x: number; y: number }) {
  const node: CanvasNode = {
    id: makeId('node'),
    kind: 'prompt',
    title,
    content,
    x: point?.x ?? Math.round((160 - transform.x) / transform.scale),
    y: point?.y ?? Math.round((160 - transform.y) / transform.scale),
  }
  nodes.value.push(node)
  return node
}

function createTemplateWorkflow() {
  const template = selectedTemplate.value
  rememberBoard()
  selectedTemplateId.value = template.id
  systemPrompt.value = template.system
  const baseX = Math.round((160 - transform.x) / transform.scale)
  const baseY = Math.round((160 - transform.y) / transform.scale)
  const prompt = createPromptNode(template.title, template.prompt, { x: baseX, y: baseY })
  const output: CanvasNode = {
    id: makeId('node'),
    kind: 'output',
    title: copy.value.outputNode,
    content: '',
    x: baseX + 360,
    y: baseY,
  }
  nodes.value.push(output)
  edges.value.push({ id: makeId('edge'), from: prompt.id, to: output.id })
  selectedNodeId.value = prompt.id
  selectedEdgeId.value = null
  saveBoard()
  setMessage(copy.value.workflowCreated, 'info')
}

function createRemixPrompt(source: CanvasNode, action: QuickAction) {
  const src = outputImageSrc(source)
  if (!src) return
  rememberBoard()
  const reference: CanvasNode = {
    id: makeId('node'),
    kind: 'image',
    title: `${source.title} ${copy.value.referenceImage}`,
    content: source.content,
    referenceImage: src,
    referenceImageName: `${safeFileName(source.title)}.${mimeExtension(src)}`,
    x: source.x + 340,
    y: source.y,
  }
  const prompt = createPromptNode(action.title, action.prompt, { x: source.x + 700, y: source.y })
  const output: CanvasNode = {
    id: makeId('node'),
    kind: 'output',
    title: copy.value.outputNode,
    content: '',
    x: source.x + 1060,
    y: source.y,
  }
  nodes.value.push(reference, output)
  edges.value.push({ id: makeId('edge'), from: reference.id, to: prompt.id }, { id: makeId('edge'), from: prompt.id, to: output.id })
  selectedNodeId.value = prompt.id
  selectedEdgeId.value = null
  saveBoard()
  setMessage(copy.value.remixCreated, 'info')
}

async function runVariantSet(source: CanvasNode) {
  if (!effectiveApiKey.value) {
    setMessage(copy.value.keyRequired, 'error')
    return
  }
  if (!window.confirm(copy.value.variantsConfirm)) return
  running.value = true
  setMessage('', 'info')
  try {
    rememberBoard()
    const basePrompt = buildPrompt(source)
    const references = getIncomingReferenceImages(source.id)
    const baseOutputCount = outputNodesFromSource(source.id).length
    for (const [index, variant] of variantPrompts.value.entries()) {
      const prompt = [basePrompt, variant.prompt].filter(Boolean).join('\n\n')
      const response = references.length ? await runImageEdit(prompt, references, 1) : await runImageGeneration(prompt, 1)
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error?.message || payload?.message || response.statusText)
      storeGeneratedImages(source, payload, {
        titlePrefix: variant.title,
        startIndex: baseOutputCount + index,
        forceNew: true,
        remember: false,
      })
    }
    saveBoard()
    setMessage(copy.value.variantsDone, 'info')
  } catch (error) {
    const detail = readableError(error instanceof Error ? error.message : String(error))
    setMessage(`${copy.value.runFailed}: ${detail}`, 'error')
  } finally {
    running.value = false
  }
}

async function runSelected() {
  if (!selectedPromptNode.value) return
  await runNode(selectedPromptNode.value.id)
}

async function runNode(id: string) {
  const node = nodes.value.find((item) => item.id === id)
  if (!node || node.kind !== 'prompt') {
    setMessage(copy.value.nodeRequired, 'error')
    return
  }
  if (!effectiveApiKey.value) {
    setMessage(copy.value.keyRequired, 'error')
    return
  }
  if (confirmBeforeRun.value) {
    const confirmMessage =
      estimatedPrice.value === copy.value.unknownPrice
        ? copy.value.confirmUnavailablePrice
        : copy.value.confirmRun.replace('{price}', estimatedPrice.value)
    if (!window.confirm(confirmMessage)) return
  }

  running.value = true
  setMessage('', 'info')
  try {
    const prompt = buildPrompt(node)
    const references = getIncomingReferenceImages(node.id)
    const response = references.length
      ? await runImageEdit(prompt, references)
      : await runImageGeneration(prompt)
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(payload?.error?.message || payload?.message || response.statusText)
    }
    const created = storeGeneratedImages(node, payload)
    if (!created.length) throw new Error(copy.value.noImageInResponse)
    selectedNodeId.value = created[0].id
    saveBoard()
    setMessage(copy.value.runDone, 'info')
  } catch (error) {
    const detail = readableError(error instanceof Error ? error.message : String(error))
    setMessage(`${copy.value.runFailed}: ${detail}`, 'error')
  } finally {
    running.value = false
  }
}

function readableError(value: string) {
  const text = value || ''
  const lower = text.toLowerCase()
  if (lower.includes('failed to fetch') || lower.includes('network')) return copy.value.networkError
  if (lower.includes('quota') || lower.includes('balance') || lower.includes('insufficient')) return copy.value.quotaError
  if (lower.includes('unauthorized') || lower.includes('invalid api key') || lower.includes('forbidden') || lower.includes('401') || lower.includes('403')) {
    return copy.value.authError
  }
  if (lower.includes('rate limit') || lower.includes('too many') || lower.includes('429')) return copy.value.rateLimitError
  if (lower.includes('policy') || lower.includes('safety') || lower.includes('moderation')) return copy.value.contentPolicyError
  return text
}

function getIncomingReferenceImages(id: string) {
  const refs: Array<{ dataUrl: string; name: string; maskDataUrl?: string; maskName?: string }> = []
  const incomingNodes = edges.value
    .filter((edge) => edge.to === id)
    .map((edge) => nodes.value.find((node) => node.id === edge.from))
    .filter((node): node is CanvasNode => Boolean(node))
  for (const item of incomingNodes) {
    const src = item.kind === 'image' ? referenceImageSrc(item) : outputImageSrc(item)
    if (src.startsWith('data:image/')) {
      refs.push({
        dataUrl: src,
        name: item.referenceImageName || `${safeFileName(item.title)}.${mimeExtension(src)}`,
        maskDataUrl: item.maskImage?.startsWith('data:image/') ? item.maskImage : undefined,
        maskName: item.maskImageName || `mask-${safeFileName(item.title)}.${item.maskImage ? mimeExtension(item.maskImage) : outputFormat.value}`,
      })
    } else if (src) {
      setMessage(copy.value.unsupportedReference, 'error')
    }
  }
  return refs.slice(0, 4)
}

function runImageGeneration(prompt: string, count = imageCount.value) {
  return fetch(buildGatewayUrl('/v1/images/generations'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${effectiveApiKey.value}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model.value,
      prompt,
      n: count,
      size: imageSize.value,
      quality: imageQuality.value,
      output_format: outputFormat.value,
      response_format: 'b64_json',
    }),
  })
}

function runImageEdit(prompt: string, references: Array<{ dataUrl: string; name: string; maskDataUrl?: string; maskName?: string }>, count = imageCount.value) {
  const form = new FormData()
  form.append('model', model.value)
  form.append('prompt', prompt)
  form.append('n', String(count))
  form.append('size', imageSize.value)
  form.append('quality', imageQuality.value)
  form.append('output_format', outputFormat.value)
  form.append('response_format', 'b64_json')
  for (const reference of references) {
    form.append('image', dataUrlToBlob(reference.dataUrl), reference.name)
    if (reference.maskDataUrl) {
      form.append('mask', dataUrlToBlob(reference.maskDataUrl), reference.maskName || 'mask.png')
    }
  }
  return fetch(buildGatewayUrl('/v1/images/edits'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${effectiveApiKey.value}`,
    },
    body: form,
  })
}

function storeGeneratedImages(
  source: CanvasNode,
  payload: unknown,
  options: { titlePrefix?: string; startIndex?: number; forceNew?: boolean; remember?: boolean } = {},
) {
  const { titlePrefix = copy.value.outputNode, startIndex = 0, forceNew = false, remember = true } = options
  const images = extractGeneratedImages(payload)
  const created: CanvasNode[] = []
  if (remember && images.length) rememberBoard()
  images.forEach((image, index) => {
    const target = findOrCreateOutputNode(source, startIndex + index, forceNew)
    target.title = images.length > 1 ? `${titlePrefix} ${index + 1}` : titlePrefix
    target.content = image.revisedPrompt || `${model.value} · ${imageSize.value} · ${imageQuality.value} · ${outputFormat.value}`
    target.imageUrl = image.imageUrl
    target.imageMime = image.imageMime
    created.push(target)
    addHistoryItem(target)
  })
  return created
}

function extractGeneratedImages(payload: unknown) {
  const results: GeneratedImageResult[] = []
  collectGeneratedImages(payload, results, 0)
  const seen = new Set<string>()
  return results.filter((item) => {
    if (seen.has(item.imageUrl)) return false
    seen.add(item.imageUrl)
    return true
  })
}

function collectGeneratedImages(value: unknown, results: GeneratedImageResult[], depth: number) {
  if (!value || depth > 6) return
  if (Array.isArray(value)) {
    value.forEach((item) => collectGeneratedImages(item, results, depth + 1))
    return
  }
  if (typeof value !== 'object') return

  const record = value as Record<string, unknown>
  const imageUrl =
    normalizeImageUrl(record.url) ||
    normalizeImageUrl(record.image_url) ||
    normalizeImageUrl(record.imageUrl) ||
    normalizeImageBase64(record.b64_json) ||
    normalizeImageBase64(record.base64) ||
    normalizeImageBase64(record.image_base64) ||
    normalizeImageBase64(record.imageBase64)

  if (imageUrl) {
    results.push({
      imageUrl,
      imageMime: imageMimeFromUrl(imageUrl),
      revisedPrompt: stringField(record.revised_prompt) || stringField(record.revisedPrompt) || stringField(record.prompt),
    })
  }

  const nestedKeys = ['data', 'output', 'images', 'content', 'result', 'results', 'image', 'message']
  nestedKeys.forEach((key) => {
    if (key in record) collectGeneratedImages(record[key], results, depth + 1)
  })
}

function normalizeImageUrl(value: unknown) {
  if (typeof value !== 'string') return ''
  const text = value.trim()
  if (/^(https?:|data:image\/|blob:)/i.test(text)) return text
  return ''
}

function normalizeImageBase64(value: unknown) {
  if (typeof value !== 'string') return ''
  const text = value.trim()
  if (!text) return ''
  if (/^data:image\//i.test(text)) return text
  if (/^https?:\/\//i.test(text)) return text
  if (text.length < 80 || /[^A-Za-z0-9+/=]/.test(text)) return ''
  return `data:image/${outputFormat.value};base64,${text}`
}

function imageMimeFromUrl(src: string) {
  const dataMime = src.match(/^data:(image\/[a-z0-9.+-]+);base64,/i)?.[1]
  if (dataMime) return dataMime
  const extension = mimeExtension(src)
  return `image/${extension === 'jpg' ? 'jpeg' : extension}`
}

function stringField(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function outputNodesFromSource(sourceId: string) {
  return edges.value
    .filter((edge) => edge.from === sourceId)
    .map((edge) => nodes.value.find((node) => node.id === edge.to && node.kind === 'output'))
    .filter((item): item is CanvasNode => Boolean(item))
}

function findOrCreateOutputNode(source: CanvasNode, index = 0, forceNew = false) {
  const outgoing = outputNodesFromSource(source.id)
  const existing = outgoing[index]
  if (existing && !forceNew) return existing
  const node: CanvasNode = {
    id: makeId('node'),
    kind: 'output',
    title: copy.value.outputNode,
    content: '',
    x: source.x + 360,
    y: source.y + index * 270,
  }
  nodes.value.push(node)
  edges.value.push({ id: makeId('edge'), from: source.id, to: node.id })
  return node
}

function setMessage(value: string, type: 'info' | 'error') {
  message.value = value
  messageType.value = type
}

function addHistoryItem(node: CanvasNode) {
  if (!node.imageUrl) return
  recentOutputs.value = [
    {
      id: makeId('history'),
      title: node.title,
      content: node.content,
      imageUrl: node.imageUrl,
      imageMime: node.imageMime || `image/${outputFormat.value}`,
      model: model.value,
      size: imageSize.value,
      quality: imageQuality.value,
      format: outputFormat.value,
      createdAt: new Date().toISOString(),
    },
    ...recentOutputs.value,
  ].slice(0, MAX_HISTORY_ITEMS)
  saveHistory()
}

function saveHistory() {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(recentOutputs.value.slice(0, MAX_HISTORY_ITEMS)))
  } catch {
    recentOutputs.value = recentOutputs.value.slice(0, Math.max(2, Math.floor(MAX_HISTORY_ITEMS / 2)))
  }
}

function loadHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]')
    recentOutputs.value = Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY_ITEMS) : []
  } catch {
    recentOutputs.value = []
  }
}

function restoreHistoryItem(item: RecentOutput) {
  rememberBoard()
  const node: CanvasNode = {
    id: makeId('node'),
    kind: 'output',
    title: item.title,
    content: item.content,
    imageUrl: item.imageUrl,
    imageMime: item.imageMime,
    x: Math.round((180 - transform.x) / transform.scale),
    y: Math.round((180 - transform.y) / transform.scale),
  }
  nodes.value.push(node)
  selectedNodeId.value = node.id
  selectedEdgeId.value = null
  saveBoard()
  setMessage(copy.value.historyRestored, 'info')
}

function restoreHistoryParams(item: RecentOutput) {
  rememberBoard()
  model.value = imageModels.includes(item.model as (typeof imageModels)[number]) ? (item.model as (typeof imageModels)[number]) : model.value
  imageSize.value = imageSizes.includes(item.size as (typeof imageSizes)[number]) ? (item.size as (typeof imageSizes)[number]) : imageSize.value
  imageQuality.value = imageQualities.includes(item.quality as (typeof imageQualities)[number]) ? (item.quality as (typeof imageQualities)[number]) : imageQuality.value
  outputFormat.value = outputFormats.includes(item.format as (typeof outputFormats)[number]) ? (item.format as (typeof outputFormats)[number]) : outputFormat.value
  saveBoard()
  setMessage(copy.value.paramsRestored, 'info')
}

function clearHistory() {
  recentOutputs.value = []
  localStorage.removeItem(HISTORY_STORAGE_KEY)
}

function deleteSelectedEdge() {
  if (!selectedEdgeId.value) return
  rememberBoard()
  edges.value = edges.value.filter((edge) => edge.id !== selectedEdgeId.value)
  selectedEdgeId.value = null
  saveBoard()
}

function autoLayout() {
  rememberBoard()
  const depth = new Map<string, number>()
  const visiting = new Set<string>()
  const visit = (id: string): number => {
    if (depth.has(id)) return depth.get(id) || 0
    if (visiting.has(id)) return 0
    visiting.add(id)
    const incoming = edges.value.filter((edge) => edge.to === id)
    const value = incoming.length ? Math.max(...incoming.map((edge) => visit(edge.from) + 1)) : 0
    visiting.delete(id)
    depth.set(id, value)
    return value
  }
  nodes.value.forEach((node) => visit(node.id))
  const lanes = new Map<number, number>()
  nodes.value
    .slice()
    .sort((a, b) => (depth.get(a.id) || 0) - (depth.get(b.id) || 0) || a.y - b.y)
    .forEach((node) => {
      const lane = depth.get(node.id) || 0
      const row = lanes.get(lane) || 0
      node.x = 80 + lane * 360
      node.y = 90 + row * 270
      lanes.set(lane, row + 1)
    })
  saveBoard()
}

function exportBoard() {
  const payload = JSON.stringify(
    {
      nodes: nodes.value,
      edges: edges.value,
      transform,
      model: model.value,
      imageSize: imageSize.value,
      imageQuality: imageQuality.value,
      outputFormat: outputFormat.value,
      imageCount: imageCount.value,
      confirmBeforeRun: confirmBeforeRun.value,
      systemPrompt: systemPrompt.value,
      canvasPattern: canvasPattern.value,
      exportedAt: new Date().toISOString(),
    },
    null,
    2,
  )
  const objectUrl = URL.createObjectURL(new Blob([payload], { type: 'application/json' }))
  triggerDownload(objectUrl, `jkapi-canvas-${new Date().toISOString().slice(0, 10)}.json`)
  setTimeout(() => URL.revokeObjectURL(objectUrl), 3000)
  setMessage(copy.value.exportDone, 'info')
}

async function exportCanvasPng() {
  if (!nodes.value.length) return
  const padding = 48
  const minX = Math.min(...nodes.value.map((node) => node.x))
  const minY = Math.min(...nodes.value.map((node) => node.y))
  const maxX = Math.max(...nodes.value.map((node) => node.x + NODE_WIDTH))
  const maxY = Math.max(...nodes.value.map((node) => node.y + Math.max(NODE_HEIGHT, node.kind === 'output' && outputImageSrc(node) ? 360 : NODE_HEIGHT)))
  const width = Math.max(640, maxX - minX + padding * 2)
  const height = Math.max(420, maxY - minY + padding * 2)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(0, 0, width, height)
  ctx.strokeStyle = '#dbe7f3'
  ctx.lineWidth = 1
  for (let x = 0; x < width; x += 32) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let y = 0; y < height; y += 32) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
  const offsetX = padding - minX
  const offsetY = padding - minY
  ctx.strokeStyle = '#0ea5e9'
  ctx.lineWidth = 3
  for (const edge of edges.value) {
    const from = nodes.value.find((node) => node.id === edge.from)
    const to = nodes.value.find((node) => node.id === edge.to)
    if (!from || !to) continue
    const x1 = from.x + NODE_WIDTH + offsetX
    const y1 = from.y + NODE_HEIGHT / 2 + offsetY
    const x2 = to.x + offsetX
    const y2 = to.y + NODE_HEIGHT / 2 + offsetY
    const gap = Math.max(80, Math.abs(x2 - x1) / 2)
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.bezierCurveTo(x1 + gap, y1, x2 - gap, y2, x2, y2)
    ctx.stroke()
  }
  for (const node of nodes.value) {
    await drawNodeToCanvas(ctx, node, offsetX, offsetY)
  }
  const objectUrl = canvas.toDataURL('image/png')
  triggerDownload(objectUrl, `jkapi-canvas-${new Date().toISOString().slice(0, 10)}.png`)
  setMessage(copy.value.exportedPng, 'info')
}

async function drawNodeToCanvas(ctx: CanvasRenderingContext2D, node: CanvasNode, offsetX: number, offsetY: number) {
  const x = node.x + offsetX
  const y = node.y + offsetY
  const imgSrc = outputImageSrc(node) || referenceImageSrc(node)
  const height = imgSrc ? 360 : NODE_HEIGHT
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 1
  roundedRect(ctx, x, y, NODE_WIDTH, height, 8)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = node.kind === 'prompt' ? '#0ea5e9' : node.kind === 'image' ? '#f59e0b' : '#14b8a6'
  ctx.fillRect(x, y, NODE_WIDTH, 4)
  ctx.fillStyle = '#0f172a'
  ctx.font = '700 16px sans-serif'
  ctx.fillText(node.title.slice(0, 26), x + 14, y + 34)
  ctx.fillStyle = '#475569'
  ctx.font = '12px sans-serif'
  ctx.fillText(nodeLabel(node.kind), x + 14, y + 56)
  if (imgSrc) {
    await drawImagePreview(ctx, imgSrc, x + 14, y + 72, NODE_WIDTH - 28, 220)
  } else {
    drawWrappedText(ctx, node.content || '', x + 14, y + 82, NODE_WIDTH - 28, 18, 6)
  }
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

function drawWrappedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
  const words = text.replace(/\s+/g, ' ').split(' ')
  let line = ''
  let lines = 0
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y + lines * lineHeight)
      line = word
      lines += 1
      if (lines >= maxLines) return
    } else {
      line = testLine
    }
  }
  if (line && lines < maxLines) ctx.fillText(line, x, y + lines * lineHeight)
}

function drawImagePreview(ctx: CanvasRenderingContext2D, src: string, x: number, y: number, width: number, height: number) {
  return new Promise<void>((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(width / img.width, height / img.height)
      const drawWidth = img.width * scale
      const drawHeight = img.height * scale
      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(x, y, width, height)
      ctx.drawImage(img, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight)
      resolve()
    }
    img.onerror = () => resolve()
    img.src = src
  })
}

function importBoard(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      applyBoardState(JSON.parse(String(reader.result || '{}')))
      saveBoard()
      setMessage(copy.value.importDone, 'info')
    } catch {
      setMessage(copy.value.importFailed, 'error')
    }
  }
  reader.readAsText(file)
}

function saveBoard() {
  try {
    ensureActiveCanvas()
    canvasStorage.saveBoard(activeCanvasId.value, {
      nodes: nodes.value,
      edges: edges.value,
      transform,
      model: model.value,
      imageSize: imageSize.value,
      imageQuality: imageQuality.value,
      outputFormat: outputFormat.value,
      imageCount: imageCount.value,
      confirmBeforeRun: confirmBeforeRun.value,
      systemPrompt: systemPrompt.value,
      sizePanelOpen: sizePanelOpen.value,
      qualityPanelOpen: qualityPanelOpen.value,
      canvasPattern: canvasPattern.value,
    })
    updateActiveCanvasRecord()
    setMessage(copy.value.saved, 'info')
  } catch {
    setMessage(copy.value.saveTooLarge, 'error')
  }
}

function ensureActiveCanvas() {
  if (activeCanvasId.value) return
  const records = canvasStorage.canvases()
  const record: CanvasRecord = records[0] || {
    id: makeStorageId('canvas'),
    title: '画布 1',
    nodes: 0,
    edges: 0,
    updatedAt: new Date().toISOString(),
  }
  if (!records.length) canvasStorage.saveCanvases([record])
  activeCanvasId.value = record.id
  canvasStorage.setActiveCanvasId(record.id)
}

function updateActiveCanvasRecord() {
  const records = canvasStorage.canvases()
  const record = records.find((item: CanvasRecord) => item.id === activeCanvasId.value)
  if (!record) return
  record.nodes = nodes.value.length
  record.edges = edges.value.length
  record.updatedAt = new Date().toISOString()
  canvasStorage.saveCanvases(records)
}

function applyBoardState(parsed: Record<string, unknown>) {
  nodes.value = Array.isArray(parsed.nodes) ? (parsed.nodes as CanvasNode[]) : []
  edges.value = Array.isArray(parsed.edges) ? (parsed.edges as CanvasEdge[]) : []
  model.value = imageModels.includes(parsed.model as (typeof imageModels)[number]) ? (parsed.model as (typeof imageModels)[number]) : 'gpt-image-2'
  imageSize.value = imageSizes.includes(parsed.imageSize as (typeof imageSizes)[number]) ? (parsed.imageSize as (typeof imageSizes)[number]) : '1024x1024'
  imageQuality.value = imageQualities.includes(parsed.imageQuality as (typeof imageQualities)[number]) ? (parsed.imageQuality as (typeof imageQualities)[number]) : 'auto'
  outputFormat.value = outputFormats.includes(parsed.outputFormat as (typeof outputFormats)[number]) ? (parsed.outputFormat as (typeof outputFormats)[number]) : 'png'
  imageCount.value = imageCounts.includes(parsed.imageCount as (typeof imageCounts)[number]) ? (parsed.imageCount as (typeof imageCounts)[number]) : 1
  confirmBeforeRun.value = typeof parsed.confirmBeforeRun === 'boolean' ? parsed.confirmBeforeRun : true
  systemPrompt.value = typeof parsed.systemPrompt === 'string' ? parsed.systemPrompt : systemPrompt.value
  sizePanelOpen.value = typeof parsed.sizePanelOpen === 'boolean' ? parsed.sizePanelOpen : false
  qualityPanelOpen.value = typeof parsed.qualityPanelOpen === 'boolean' ? parsed.qualityPanelOpen : false
  canvasPattern.value = ['grid', 'dots', 'plain'].includes(String(parsed.canvasPattern)) ? (parsed.canvasPattern as CanvasPattern) : 'grid'
  const parsedTransform = parsed.transform as { x?: unknown; y?: unknown; scale?: unknown } | undefined
  if (parsedTransform) {
    transform.x = Number(parsedTransform.x) || transform.x
    transform.y = Number(parsedTransform.y) || transform.y
    transform.scale = Number(parsedTransform.scale) || transform.scale
  }
  if (!nodes.value.length) seedBoard()
}

function persistSelectedApiKey() {
  localStorage.setItem(SELECTED_API_KEY_STORAGE_KEY, selectedApiKeyId.value)
}

async function loadApiKeys() {
  loadingKeys.value = true
  try {
    const response = await keysAPI.list(1, 100, { status: 'active', sort_by: 'created_at', sort_order: 'desc' })
    apiKeys.value = response.items
    const saved = localStorage.getItem(SELECTED_API_KEY_STORAGE_KEY) || ''
    const preferred =
      imageApiKeys.value.find((key) => String(key.id) === saved) ||
      imageApiKeys.value.find((key) => key.name.includes('AI画布') || key.name.includes('生图')) ||
      imageApiKeys.value[0]
    selectedApiKeyId.value = preferred ? String(preferred.id) : ''
    if (!preferred) setMessage(copy.value.noImageKey, 'error')
  } catch {
    setMessage(copy.value.noImageKey, 'error')
  } finally {
    loadingKeys.value = false
  }
}

function loadBoard() {
  ensureActiveCanvas()
  let parsed = canvasStorage.board(activeCanvasId.value)
  if (!Object.keys(parsed).length) {
    const legacy = canvasStorage.takeLegacyBoard()
    if (Object.keys(legacy).length) {
      parsed = legacy
      canvasStorage.saveBoard(activeCanvasId.value, legacy)
    }
  }
  if (!Object.keys(parsed).length) {
    seedBoard()
    return
  }
  try {
    applyBoardState(parsed)
  } catch {
    seedBoard()
  }
}

function seedBoard() {
  nodes.value = [
    {
      id: 'node_seed_prompt',
      kind: 'prompt',
      title: String(locale.value).startsWith('zh') ? '商业海报' : 'Commercial Poster',
      content: String(locale.value).startsWith('zh')
        ? '生成一张高转化商业海报：主体清晰，画面干净高级，强光影层次，适合社媒投放，预留中文标题区域。'
        : 'Generate a high-converting commercial poster with a clear subject, premium clean composition, strong lighting depth, and space for a headline.',
      x: 80,
      y: 110,
    },
    { id: 'node_seed_output', kind: 'output', title: copy.value.outputNode, content: '', x: 450, y: 110 },
  ]
  edges.value = [{ id: 'edge_seed', from: 'node_seed_prompt', to: 'node_seed_output' }]
  selectedNodeId.value = nodes.value[0].id
}

function resetBoard() {
  rememberBoard()
  seedBoard()
  saveBoard()
  setMessage(copy.value.cleared, 'info')
}

function fitView() {
  transform.x = 120
  transform.y = 72
  transform.scale = 1
  saveBoard()
}

function handleKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  const editing = Boolean(target?.closest('input, textarea, select'))
  if (event.key === 'Escape') {
    closeContextMenu()
    promptPreview.value = ''
    previewImage.value = null
    connectMode.value = false
    pendingSourceId.value = null
    return
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
    event.preventDefault()
    saveBoard()
    return
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z' && !editing) {
    event.preventDefault()
    if (event.shiftKey) redoBoard()
    else undoBoard()
    return
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y' && !editing) {
    event.preventDefault()
    redoBoard()
    return
  }
  if ((event.key === 'Delete' || event.key === 'Backspace') && !editing) {
    event.preventDefault()
    if (selectedNodeId.value) deleteNode(selectedNodeId.value)
    else deleteSelectedEdge()
  }
}

onMounted(() => {
  loadBoard()
  loadHistory()
  void loadApiKeys()
  window.addEventListener('paste', handlePaste)
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('click', closeContextMenu)
})

onBeforeUnmount(() => {
  window.removeEventListener('paste', handlePaste)
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('click', closeContextMenu)
})
</script>

<style scoped>
.canvas-shell {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) 300px;
  min-height: calc(100dvh - 112px);
  overflow: hidden;
  border: 1px solid rgb(226 232 240);
  border-radius: 8px;
  background: rgb(248 250 252);
  box-shadow: 0 18px 50px rgb(15 23 42 / 8%);
}

.canvas-page {
  min-height: calc(100dvh - 112px);
  overflow: hidden;
}

.dark .canvas-shell {
  border-color: rgb(51 65 85);
  background: rgb(15 23 42);
}

.canvas-toolbar,
.canvas-inspector {
  background: rgb(255 255 255 / 94%);
}

.dark .canvas-toolbar,
.dark .canvas-inspector {
  background: rgb(15 23 42 / 92%);
}

.canvas-toolbar {
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  padding: 12px 8px;
  border-right: 1px solid rgb(226 232 240);
}

.dark .canvas-toolbar {
  border-right-color: rgb(51 65 85);
}

.tool-button,
.node-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(203 213 225);
  background: rgb(255 255 255);
  color: rgb(51 65 85);
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.tool-button {
  width: 38px;
  height: 38px;
  border-radius: 8px;
}

.tool-button:hover,
.tool-button.active {
  border-color: rgb(14 165 233);
  background: rgb(224 242 254);
  color: rgb(3 105 161);
}

.tool-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.tool-button.danger:hover {
  border-color: rgb(248 113 113);
  background: rgb(254 226 226);
  color: rgb(185 28 28);
}

.tool-button svg,
.node-icon-button svg,
.primary-action svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.tool-icon {
  font-weight: 800;
  font-size: 13px;
}

.tool-divider {
  width: 26px;
  height: 1px;
  background: rgb(226 232 240);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.canvas-workspace {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-width: 0;
}

.canvas-topbar {
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  border-bottom: 1px solid rgb(226 232 240);
  background: rgb(255 255 255 / 92%);
}

.dark .canvas-topbar {
  border-bottom-color: rgb(51 65 85);
  background: rgb(15 23 42 / 90%);
}

.canvas-topbar h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 750;
  color: rgb(15 23 42);
}

.canvas-topbar p {
  margin: 3px 0 0;
  font-size: 13px;
  color: rgb(100 116 139);
}

.dark .canvas-topbar h1 {
  color: rgb(248 250 252);
}

.dark .canvas-topbar p {
  color: rgb(148 163 184);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.model-field,
.field {
  display: grid;
  gap: 6px;
}

.model-field {
  grid-template-columns: auto 160px;
  align-items: center;
  color: rgb(71 85 105);
  font-size: 13px;
}

.model-field select,
.model-field input,
.field select,
.field input,
.field textarea,
.node-title,
.node-content {
  width: 100%;
  border: 1px solid rgb(203 213 225);
  border-radius: 8px;
  background: rgb(255 255 255);
  color: rgb(15 23 42);
  outline: none;
}

.model-field select,
.model-field input,
.field select,
.field input,
.node-title {
  height: 34px;
  padding: 0 10px;
}

.field textarea,
.node-content {
  min-height: 94px;
  padding: 9px 10px;
  resize: vertical;
}

.primary-action,
.mini-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 8px;
  background: rgb(20 184 166);
  color: white;
  font-weight: 700;
}

.primary-action {
  height: 36px;
  gap: 8px;
  padding: 0 14px;
}

.primary-action:disabled,
.mini-action:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.canvas-viewport {
  position: relative;
  min-height: 0;
  cursor: grab;
  overflow: hidden;
  background-color: rgb(241 245 249);
  background-image:
    linear-gradient(rgb(203 213 225 / 48%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(203 213 225 / 48%) 1px, transparent 1px);
  background-size: 32px 32px;
}

.canvas-viewport.dragging {
  outline: 3px solid rgb(20 184 166 / 35%);
  outline-offset: -3px;
}

.canvas-viewport.pattern-dots {
  background-image: radial-gradient(rgb(148 163 184 / 70%) 1px, transparent 1px);
  background-size: 22px 22px;
}

.canvas-viewport.pattern-plain {
  background-image: none;
}

.canvas-minimap {
  position: absolute;
  right: 14px;
  bottom: 14px;
  z-index: 4;
  width: 132px;
  height: 90px;
  overflow: hidden;
  border: 1px solid rgb(148 163 184);
  border-radius: 6px;
  background: rgb(255 255 255 / 92%);
  box-shadow: 0 8px 24px rgb(15 23 42 / 12%);
}

.canvas-minimap span {
  position: absolute;
  width: 12px;
  height: 8px;
  border-radius: 2px;
  background: rgb(14 165 233);
}

.canvas-minimap .map-image,
.canvas-minimap .map-video,
.canvas-minimap .map-audio {
  background: rgb(245 158 11);
}

.canvas-minimap .map-output {
  background: rgb(20 184 166);
}

.drop-hint {
  position: absolute;
  inset: 18px;
  z-index: 6;
  display: grid;
  place-items: center;
  border: 2px dashed rgb(20 184 166);
  border-radius: 8px;
  background: rgb(240 253 250 / 82%);
  color: rgb(15 118 110);
  font-size: 16px;
  font-weight: 800;
  pointer-events: none;
}

.dark .canvas-viewport {
  background-color: rgb(2 6 23);
  background-image:
    linear-gradient(rgb(71 85 105 / 45%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(71 85 105 / 45%) 1px, transparent 1px);
}

.canvas-grid {
  position: absolute;
  inset: 0;
  transform-origin: 0 0;
}

.edge-layer {
  position: absolute;
  left: -4000px;
  top: -4000px;
  width: 8000px;
  height: 8000px;
  overflow: visible;
  pointer-events: none;
}

.edge-path {
  fill: none;
  stroke: rgb(14 165 233);
  stroke-width: 3;
  pointer-events: stroke;
}

.edge-path.selected {
  stroke: rgb(244 114 182);
}

.canvas-node {
  position: absolute;
  width: 280px;
  min-height: 214px;
  border: 1px solid rgb(203 213 225);
  border-radius: 8px;
  background: rgb(255 255 255);
  box-shadow: 0 16px 34px rgb(15 23 42 / 10%);
  cursor: default;
}

.canvas-node.selected {
  border-color: rgb(14 165 233);
  box-shadow: 0 0 0 3px rgb(14 165 233 / 18%), 0 16px 34px rgb(15 23 42 / 12%);
}

.canvas-node.source {
  border-color: rgb(20 184 166);
  box-shadow: 0 0 0 3px rgb(20 184 166 / 22%), 0 16px 34px rgb(15 23 42 / 12%);
}

.node-prompt {
  border-top: 4px solid rgb(14 165 233);
}

.node-image {
  border-top: 4px solid rgb(245 158 11);
}

.node-video {
  border-top: 4px solid rgb(239 68 68);
}

.node-audio {
  border-top: 4px solid rgb(168 85 247);
}

.node-output {
  border-top: 4px solid rgb(20 184 166);
}

.node-head,
.node-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
}

.node-type {
  font-size: 12px;
  font-weight: 800;
  color: rgb(71 85 105);
}

.node-icon-button {
  width: 28px;
  height: 28px;
  border-radius: 8px;
}

.node-title {
  margin: 0 12px 8px;
  width: calc(100% - 24px);
  font-weight: 700;
}

.node-content {
  margin: 0 12px;
  width: calc(100% - 24px);
  min-height: 86px;
  font-size: 13px;
}

.node-preview {
  margin: 10px 12px 0;
  display: grid;
  gap: 8px;
}

.node-preview img {
  width: 100%;
  max-height: 190px;
  object-fit: contain;
  border: 1px solid rgb(226 232 240);
  border-radius: 8px;
  background: rgb(248 250 252);
}

.node-preview video,
.node-preview audio {
  width: 100%;
  max-height: 190px;
}

.editor-library-link {
  height: 34px;
  text-decoration: none;
}

.node-preview-meta {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: rgb(71 85 105);
  font-size: 12px;
  line-height: 1.45;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.node-preview-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(72px, 1fr));
  gap: 8px;
}

.node-foot {
  color: rgb(100 116 139);
  font-size: 12px;
}

.mini-action {
  height: 28px;
  padding: 0 10px;
  font-size: 12px;
}

.mini-action.secondary {
  flex: 1;
  border-color: rgb(203 213 225);
  background: rgb(255 255 255);
  color: rgb(51 65 85);
}

.canvas-inspector {
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  border-left: 1px solid rgb(226 232 240);
  overflow-y: auto;
}

.dark .canvas-inspector {
  border-left-color: rgb(51 65 85);
}

.panel-section {
  display: grid;
  gap: 12px;
}

.field-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px;
}

.checkbox-field {
  grid-template-columns: 18px minmax(0, 1fr);
  align-items: center;
  align-self: end;
  min-height: 34px;
}

.checkbox-field input {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: rgb(20 184 166);
}

.panel-section h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  color: rgb(15 23 42);
}

.choice-section {
  display: grid;
  gap: 10px;
}

.choice-heading {
  display: grid;
  gap: 3px;
}

.choice-heading-button {
  grid-template-columns: minmax(0, 1fr) auto 18px;
  align-items: center;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.choice-heading-text {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.choice-heading span {
  color: rgb(15 23 42);
  font-size: 13px;
  font-weight: 800;
}

.choice-heading small {
  color: rgb(100 116 139);
  font-size: 12px;
  line-height: 1.45;
}

.choice-heading-summary {
  display: inline-flex;
  align-items: center;
  max-width: 138px;
  min-height: 28px;
  gap: 6px;
  padding: 4px 8px;
  overflow: hidden;
  border: 1px solid rgb(226 232 240);
  border-radius: 999px;
  background: rgb(248 250 252);
  color: rgb(51 65 85);
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.choice-heading-summary em {
  flex: 0 0 auto;
  color: rgb(120 83 36);
  font-size: 11px;
  font-style: normal;
}

.collapse-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgb(100 116 139);
  font-size: 18px;
  line-height: 1;
  transition: transform 0.15s ease;
}

.collapse-icon.open {
  transform: rotate(180deg);
}

.route-list,
.choice-list {
  display: grid;
  gap: 8px;
}

.route-card,
.choice-card {
  position: relative;
  display: grid;
  width: 100%;
  min-width: 0;
  border: 1px solid rgb(226 232 240);
  border-radius: 8px;
  background: rgb(255 255 255);
  color: rgb(15 23 42);
  text-align: left;
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}

.route-card {
  grid-template-columns: 22px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  padding: 10px;
}

.route-card.manual {
  grid-template-columns: 22px minmax(0, 1fr);
}

.choice-card {
  grid-template-columns: 42px minmax(0, 1fr) 18px;
  gap: 10px;
  align-items: center;
  padding: 12px;
}

.choice-summary-card {
  min-height: 74px;
}

.route-card:hover,
.choice-card:hover,
.route-card.active,
.choice-card.active {
  border-color: rgb(20 184 166);
  background: rgb(240 253 250);
  box-shadow: 0 10px 28px rgb(15 23 42 / 8%);
}

.route-card.active,
.choice-card.active {
  border-width: 2px;
  padding: 9px;
}

.choice-card.active {
  padding: 11px;
}

.choice-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: transparent;
  font-size: 14px;
  font-weight: 900;
}

.route-card.active .choice-check,
.choice-card.active .choice-check {
  color: rgb(20 184 166);
}

.route-main,
.choice-text {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.route-main strong,
.choice-text strong {
  overflow-wrap: anywhere;
  font-size: 14px;
  font-weight: 800;
}

.route-main small,
.choice-text small {
  color: rgb(100 116 139);
  font-size: 12px;
  line-height: 1.4;
}

.choice-text em {
  width: fit-content;
  max-width: 100%;
  padding: 3px 8px;
  overflow-wrap: anywhere;
  border: 1px solid rgb(217 199 164);
  border-radius: 999px;
  background: rgb(255 251 235);
  color: rgb(120 83 36);
  font-size: 11px;
  font-style: normal;
  font-weight: 800;
}

.route-price {
  color: rgb(120 83 36);
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.size-icon {
  display: inline-flex;
  width: 34px;
  height: 34px;
  border: 2px solid rgb(188 170 139);
  border-radius: 8px;
  background: rgb(255 255 255);
}

.size-auto {
  border-style: dashed;
  border-radius: 12px;
  background: linear-gradient(135deg, rgb(255 255 255), rgb(240 253 250));
}

.size-square {
  width: 32px;
  height: 32px;
}

.size-portrait {
  width: 27px;
  height: 40px;
}

.size-landscape {
  width: 42px;
  height: 28px;
}

.quality-gem {
  width: 32px;
  height: 32px;
  border: 2px solid rgb(203 213 225);
  border-radius: 9px;
  transform: rotate(45deg) scale(0.72);
  background: linear-gradient(135deg, rgb(255 255 255), rgb(226 232 240));
  box-shadow: inset 0 -8px 14px rgb(255 255 255 / 55%);
}

.quality-high {
  border-color: rgb(125 165 255);
  background: linear-gradient(135deg, rgb(219 234 254), rgb(96 165 250));
}

.quality-medium {
  border-color: rgb(94 234 212);
  background: linear-gradient(135deg, rgb(204 251 241), rgb(45 212 191));
}

.quality-low {
  border-color: rgb(252 211 77);
  background: linear-gradient(135deg, rgb(254 243 199), rgb(251 191 36));
}

.field span {
  color: rgb(71 85 105);
  font-size: 12px;
  font-weight: 700;
}

.status-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: rgb(71 85 105);
  font-size: 13px;
}

.status-line strong {
  color: rgb(15 23 42);
}

.message {
  margin: 0;
  padding: 10px;
  border-radius: 8px;
  background: rgb(240 253 250);
  color: rgb(15 118 110);
  font-size: 13px;
}

.message.error {
  background: rgb(254 242 242);
  color: rgb(185 28 28);
}

.upload-drop {
  display: grid;
  min-height: 42px;
  cursor: pointer;
}

.upload-drop input {
  display: none;
}

.upload-drop span {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 10px 12px;
  overflow: hidden;
  border: 1px dashed rgb(148 163 184);
  border-radius: 8px;
  color: rgb(71 85 105);
  font-size: 13px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inspector-preview {
  display: grid;
  gap: 8px;
}

.inspector-preview img {
  width: 100%;
  max-height: 180px;
  object-fit: contain;
  border: 1px solid rgb(226 232 240);
  border-radius: 8px;
  background: rgb(248 250 252);
}

.inspector-actions {
  display: flex;
  gap: 8px;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.template-card {
  display: grid;
  gap: 4px;
  min-height: 64px;
  padding: 10px;
  border: 1px solid rgb(226 232 240);
  border-radius: 8px;
  background: rgb(255 255 255);
  color: rgb(15 23 42);
  text-align: left;
}

.template-card:hover {
  border-color: rgb(20 184 166);
  background: rgb(240 253 250);
}

.template-card strong {
  font-size: 13px;
}

.template-card span {
  color: rgb(100 116 139);
  font-size: 11px;
  font-weight: 700;
}

.library-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.compare-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.library-item {
  display: grid;
  gap: 6px;
  min-width: 0;
  padding: 6px;
  border: 1px solid rgb(226 232 240);
  border-radius: 8px;
  background: rgb(255 255 255);
  color: rgb(51 65 85);
  text-align: left;
}

.compare-item {
  display: grid;
  padding: 4px;
  border: 1px solid rgb(226 232 240);
  border-radius: 8px;
  background: rgb(255 255 255);
}

.library-item img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 6px;
  background: rgb(248 250 252);
}

.compare-item img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 6px;
  background: rgb(248 250 252);
}

.library-item span {
  overflow: hidden;
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.full-width {
  width: 100%;
}

.context-menu {
  position: fixed;
  z-index: 40;
  display: grid;
  min-width: 132px;
  padding: 6px;
  border: 1px solid rgb(203 213 225);
  border-radius: 8px;
  background: rgb(255 255 255);
  box-shadow: 0 18px 42px rgb(15 23 42 / 16%);
}

.context-menu button {
  height: 32px;
  padding: 0 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: rgb(51 65 85);
  font-size: 13px;
  font-weight: 700;
  text-align: left;
}

.context-menu button:hover {
  background: rgb(241 245 249);
}

.context-menu button.danger {
  color: rgb(185 28 28);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgb(15 23 42 / 48%);
}

.canvas-modal,
.image-modal {
  display: grid;
  gap: 12px;
  width: min(720px, 100%);
  max-height: calc(100vh - 48px);
  padding: 16px;
  overflow: auto;
  border: 1px solid rgb(226 232 240);
  border-radius: 8px;
  background: rgb(255 255 255);
  box-shadow: 0 24px 80px rgb(15 23 42 / 28%);
}

.canvas-modal header,
.image-modal header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.canvas-modal h2,
.image-modal h2 {
  margin: 0;
  color: rgb(15 23 42);
  font-size: 16px;
  font-weight: 800;
}

.canvas-modal textarea {
  min-height: 320px;
  padding: 12px;
  border: 1px solid rgb(203 213 225);
  border-radius: 8px;
  color: rgb(15 23 42);
  resize: vertical;
}

.image-modal {
  width: min(980px, 100%);
}

.image-modal img {
  max-width: 100%;
  max-height: calc(100vh - 150px);
  object-fit: contain;
  border-radius: 8px;
  background: rgb(248 250 252);
}

.mask-modal {
  display: grid;
  gap: 14px;
  width: min(1040px, 100%);
  max-height: calc(100vh - 48px);
  padding: 16px;
  overflow: auto;
  border: 1px solid rgb(226 232 240);
  border-radius: 8px;
  background: rgb(255 255 255);
  box-shadow: 0 24px 80px rgb(15 23 42 / 28%);
}

.mask-modal header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.mask-modal h2 {
  margin: 0;
  color: rgb(15 23 42);
  font-size: 16px;
  font-weight: 800;
}

.mask-modal p {
  margin: 4px 0 0;
  color: rgb(100 116 139);
  font-size: 13px;
}

.mask-controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 140px;
  gap: 12px;
  align-items: end;
}

.mask-stage {
  position: relative;
  width: 100%;
  min-height: 280px;
  overflow: hidden;
  border: 1px solid rgb(203 213 225);
  border-radius: 8px;
  background: rgb(15 23 42);
}

.mask-stage img,
.mask-stage canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.mask-stage img {
  object-fit: contain;
}

.mask-stage canvas {
  cursor: crosshair;
  touch-action: none;
}

.mask-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.dark .tool-button,
.dark .node-icon-button,
.dark .model-field select,
.dark .model-field input,
.dark .field select,
.dark .field input,
.dark .field textarea,
.dark .node-title,
.dark .node-content,
.dark .canvas-node {
  border-color: rgb(51 65 85);
  background: rgb(30 41 59);
  color: rgb(226 232 240);
}

.dark .node-preview img {
  border-color: rgb(51 65 85);
  background: rgb(15 23 42);
}

.dark .node-preview-meta {
  color: rgb(148 163 184);
}

.dark .drop-hint {
  background: rgb(20 184 166 / 16%);
  color: rgb(153 246 228);
}

.dark .mini-action.secondary {
  border-color: rgb(51 65 85);
  background: rgb(30 41 59);
  color: rgb(226 232 240);
}

.dark .upload-drop span,
.dark .library-item,
.dark .template-card,
.dark .compare-item,
.dark .inspector-preview img,
.dark .context-menu,
.dark .canvas-modal,
.dark .image-modal,
.dark .mask-modal {
  border-color: rgb(51 65 85);
  background: rgb(30 41 59);
  color: rgb(226 232 240);
}

.dark .library-item img,
.dark .compare-item img,
.dark .image-modal img {
  background: rgb(15 23 42);
}

.dark .context-menu button {
  color: rgb(226 232 240);
}

.dark .context-menu button:hover {
  background: rgb(51 65 85);
}

.dark .template-card:hover {
  border-color: rgb(20 184 166);
  background: rgb(15 118 110 / 18%);
}

.dark .template-card span {
  color: rgb(148 163 184);
}

.dark .canvas-modal textarea {
  border-color: rgb(51 65 85);
  background: rgb(15 23 42);
  color: rgb(226 232 240);
}

.dark .panel-section h2,
.dark .status-line strong,
.dark .canvas-modal h2,
.dark .image-modal h2,
.dark .mask-modal h2 {
  color: rgb(248 250 252);
}

.dark .mask-modal p {
  color: rgb(148 163 184);
}

.dark .field span,
.dark .status-line,
.dark .node-type,
.dark .node-foot,
.dark .model-field {
  color: rgb(148 163 184);
}

.dark .choice-heading span,
.dark .route-main strong,
.dark .choice-text strong {
  color: rgb(248 250 252);
}

.dark .choice-heading small,
.dark .route-main small,
.dark .choice-text small {
  color: rgb(148 163 184);
}

.dark .choice-heading-button {
  background: transparent;
}

.dark .choice-heading-summary {
  border-color: rgb(51 65 85);
  background: rgb(15 23 42);
  color: rgb(226 232 240);
}

.dark .choice-heading-summary em {
  color: rgb(253 230 138);
}

.dark .collapse-icon {
  color: rgb(148 163 184);
}

.dark .route-card,
.dark .choice-card {
  border-color: rgb(51 65 85);
  background: rgb(15 23 42);
}

.dark .route-card:hover,
.dark .choice-card:hover,
.dark .route-card.active,
.dark .choice-card.active {
  border-color: rgb(45 212 191);
  background: rgb(19 78 74 / 42%);
}

.dark .choice-text em {
  border-color: rgb(120 83 36);
  background: rgb(69 45 12 / 55%);
  color: rgb(253 230 138);
}

.dark .route-price {
  color: rgb(253 230 138);
}

.dark .size-icon {
  border-color: rgb(148 163 184);
  background: rgb(15 23 42);
}

@media (max-width: 1024px) {
  .canvas-page {
    min-height: calc(100dvh - 96px);
  }

  .canvas-shell {
    grid-template-columns: 52px minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) auto;
  }

  .canvas-inspector {
    grid-column: 1 / -1;
    max-height: 320px;
    border-left: 0;
    border-top: 1px solid rgb(226 232 240);
  }
}

@media (max-width: 720px) {
  .canvas-page {
    min-height: calc(100dvh - 80px);
  }

  .canvas-shell {
    min-height: calc(100dvh - 80px);
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr);
  }

  .canvas-toolbar {
    flex-direction: row;
    border-right: 0;
    border-bottom: 1px solid rgb(226 232 240);
  }

  .canvas-topbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .topbar-actions {
    width: 100%;
    align-items: stretch;
    flex-direction: column;
  }

  .model-field {
    grid-template-columns: 1fr;
  }

  .field-grid {
    grid-template-columns: 1fr;
  }

  .compare-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .mask-controls,
  .mask-actions {
    grid-template-columns: 1fr;
  }
}

/* Target canvas layout: bright workbench with floating controls. */
.canvas-shell {
  position: relative;
  display: block;
  min-height: calc(100dvh - 112px);
  overflow: hidden;
  background: linear-gradient(180deg, #f7f9fc 0%, #eef3f9 100%);
  color: #1f2937;
}

.canvas-workspace {
  position: absolute;
  inset: 0;
}

.canvas-topbar {
  position: absolute;
  z-index: 12;
  top: 16px;
  left: 18px;
  width: auto;
  padding: 0;
  border: 0;
  background: transparent;
}

.canvas-topbar > div:first-child,
.canvas-topbar .editor-library-link,
.canvas-topbar .model-field {
  display: none;
}

.canvas-topbar .primary-action {
  min-width: 108px;
  height: 36px;
  border: 1px solid #1267f7;
  border-radius: 6px;
  background: #1267f7;
  color: #fff;
}

.canvas-viewport,
.dark .canvas-viewport {
  position: absolute;
  inset: 0;
  height: 100%;
  border: 0;
  border-radius: 0;
  background-color: #f7f9fc;
  background-image: linear-gradient(#dfe7f1 1px, transparent 1px), linear-gradient(90deg, #dfe7f1 1px, transparent 1px);
  background-size: 48px 48px;
}

.canvas-toolbar {
  position: absolute;
  z-index: 15;
  right: 50%;
  bottom: 18px;
  left: auto;
  width: auto;
  max-width: calc(100vw - 360px);
  height: 58px;
  padding: 7px;
  overflow-x: auto;
  border: 1px solid #d8e0ea;
  border-radius: 8px;
  background: rgba(255,255,255,.92);
  box-shadow: 0 12px 34px rgb(15 23 42 / 10%);
  transform: translateX(50%);
  flex-direction: row;
}

.tool-button,
.dark .tool-button {
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  border: 1px solid transparent;
  border-radius: 5px;
  background: transparent;
  color: #5b6472;
}

.tool-button:hover,
.tool-button.active,
.library-tool {
  background: #eaf2ff;
  color: #1267f7;
}

.tool-divider {
  flex: 0 0 1px;
  width: 1px;
  height: 28px;
  margin: 6px 3px;
  background: #d6dee8;
}

.canvas-inspector,
.dark .canvas-inspector {
  position: absolute;
  z-index: 14;
  top: 50%;
  left: 50%;
  width: 340px;
  max-height: 330px;
  padding: 12px;
  overflow: auto;
  border: 1px solid #d9e2ec;
  border-radius: 8px;
  background: rgba(255,255,255,.96);
  color: #1f2937;
  box-shadow: 0 12px 34px rgb(15 23 42 / 10%);
  transform: translate(-50%, -50%);
}

.canvas-inspector .panel-section {
  padding: 0;
  border: 0;
}

.canvas-inspector .panel-section:not(:first-child) {
  display: none;
}

.canvas-inspector .panel-section h2 {
  margin: 0 0 10px;
  font-size: 14px;
}

.canvas-inspector .choice-section,
.canvas-inspector .field,
.canvas-inspector .field-grid {
  margin-bottom: 8px;
}

.canvas-inspector .route-list,
.canvas-inspector .choice-list {
  max-height: 96px;
  overflow: auto;
}

.canvas-inspector .choice-card,
.canvas-inspector .route-card {
  min-height: 48px;
}

.canvas-minimap {
  right: auto;
  bottom: 24px;
  left: 22px;
  border-color: #d6dee8;
  background: rgba(255,255,255,.94);
}

.canvas-node,
.dark .canvas-node {
  border-color: #d8e0ea;
  background: #fff;
  color: #1f2937;
  box-shadow: 0 10px 30px rgb(15 23 42 / 8%);
}

@media (max-width: 900px) {
  .canvas-toolbar {
    right: 12px;
    bottom: 12px;
    left: 12px;
    max-width: none;
    transform: none;
  }

  .canvas-inspector {
    top: 66px;
    right: 12px;
    left: auto;
    width: min(340px, calc(100vw - 24px));
    max-height: 280px;
    transform: none;
  }

  .canvas-minimap {
    display: none;
  }
}
</style>
