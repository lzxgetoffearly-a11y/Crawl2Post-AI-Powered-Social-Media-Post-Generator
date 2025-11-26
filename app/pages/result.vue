<script setup lang="ts">
import { useModels } from '@/composables/useModels'
import { Chat } from '@ai-sdk/vue'
import { getTextFromMessage } from '@nuxt/ui/utils/ai'
import { useClipboard } from '@vueuse/core'
import { DefaultChatTransport } from 'ai'
import type { DefineComponent, UIMessage } from 'vue'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import ProseStreamPre from '../components/prose/PreStream.vue'

const components = {
  pre: ProseStreamPre as unknown as DefineComponent
}

const route = useRoute()
const toast = useToast()
const clipboard = useClipboard()
const { model } = useModels()

// ----------------------
// 顶部对话框：显示 index.vue 传来的结果 / 错误
// ----------------------
const text = route.query.text as string || ''
const error = route.query.error as string || ''

// ----------------------
// Chat 原有逻辑
// ----------------------
const input = ref('')
const copied = ref(false)

const chat = new Chat({
  id: 'session',
  messages: [],
  transport: new DefaultChatTransport({
    api: `/api/ai`,
    body: {
      model: model.value
    }
  }),
  onData: (dataPart) => {
    if (dataPart.type === 'data-chat-title') {
      // 可选刷新逻辑
    }
  },
  onError(error) {
    const { message } = typeof error.message === 'string' && error.message[0] === '{' ? JSON.parse(error.message) : error
    toast.add({
      description: message,
      icon: 'i-lucide-alert-circle',
      color: 'error',
      duration: 0
    })
  }
})

function handleSubmit(e: Event) {
  e.preventDefault()
  if (input.value.trim()) {
    chat.sendMessage({ text: input.value })
    input.value = ''
  }
}

function copy(e: MouseEvent, message: UIMessage) {
  clipboard.copy(getTextFromMessage(message))
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

onMounted(() => {
  if (chat.messages.length === 0 && text) {
    // 可把顶部结果加入消息流（可选）
  }
})
</script>

<template>
  <UDashboardPanel id="chat" class="relative" :ui="{ body: 'p-0 sm:p-0' }">
    <template #header>
      <DashboardNavbar />
    </template>

    <template #body>
      <UContainer class="flex-1 flex flex-col gap-4 sm:gap-6 pt-6 pb-32 items-center">

        <!-- ⭐ 顶部显示 index.vue 传来的结果/错误 -->
        <div class="w-full max-w-lg flex flex-col gap-2">
          <div
            v-if="text"
            class="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-2xl shadow"
          >
            <p class="text-base whitespace-pre-line">{{ text }}</p>
          </div>

          <div
            v-if="error"
            class="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 p-4 rounded-2xl shadow"
          >
            <p class="text-base">{{ error }}</p>
          </div>
        </div>

        <!-- ⭐ Chat 消息列表 -->
        <UChatMessages
          should-auto-scroll
          :messages="chat.messages"
          :status="chat.status"
          :assistant="chat.status !== 'streaming' ? { actions: [{ label: 'Copy', icon: copied ? 'i-lucide-copy-check' : 'i-lucide-copy', onClick: copy }] } : { actions: [] }"
          :spacing-offset="160"
          class="lg:pt-(--ui-header-height) pb-4 sm:pb-6 w-full max-w-lg"
        >
          <template #content="{ message }">
            <div class="*:first:mt-0 *:last:mb-0">
              <template v-for="(part, index) in message.parts" :key="`${message.id}-${part.type}-${index}${'state' in part ? `-${part.state}` : ''}`">
                <Reasoning
                  v-if="part.type === 'reasoning'"
                  :text="part.text"
                  :is-streaming="part.state !== 'done'"
                />
                <MDCCached
                  v-else-if="part.type === 'text'"
                  :value="part.text"
                  :cache-key="`${message.id}-${index}`"
                  :components="components"
                  :parser-options="{ highlight: false }"
                  class="*:first:mt-0 *:last:mb-0"
                />
              </template>
            </div>
          </template>
        </UChatMessages>

      </UContainer>

      <!-- ⭐ 底部发送框（居中、宽度合理、不遮导航栏） -->
      <div
        class="fixed left-1/2 transform -translate-x-1/2 bg-white dark:bg-black p-4
               border-t border-neutral-200 dark:border-neutral-800 rounded-t-xl shadow-lg"
        :style="{ bottom: 'calc(var(--ui-navbar-height, 64px))', maxWidth: '640px', width: '95%' }"
      >
        <UChatPrompt
          v-model="input"
          variant="subtle"
          class="[view-transition-name:chat-prompt]"
          @submit="handleSubmit"
        >
          <template #footer>
            <ModelSelect v-model="model" />
            <UChatPromptSubmit color="neutral" />
          </template>
        </UChatPrompt>
      </div>

    </template>
  </UDashboardPanel>
</template>
