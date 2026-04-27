<script setup>
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { supabase } from '../../../lib/supabase'
import { useContentStore } from '../../../stores/content'

const props = defineProps({ isEditing: Boolean })
const emit = defineEmits(['saved', 'error', 'saving'])

const { t } = useI18n()
const contentStore = useContentStore()

const form = ref({ business_name: '' })
const originalData = ref({})

function loadData() {
  if (contentStore.settings) {
    form.value.business_name = contentStore.settings.business_name || ''
    originalData.value = JSON.parse(JSON.stringify(form.value))
  }
}

onMounted(loadData)
watch(() => contentStore.settings, loadData, { deep: true })

function cancelEdit() {
  form.value = JSON.parse(JSON.stringify(originalData.value))
}

async function saveAll() {
  emit('saving', true)
  try {
    await supabase.from('site_settings').update({ business_name: form.value.business_name }).eq('id', 1)
    await contentStore.fetchAllData()
    emit('saved')
  } catch (e) { emit('error', e.message) } finally { emit('saving', false) }
}

defineExpose({ saveAll, cancelEdit })
</script>

<template>
  <div class="management-page">
    <section class="edit-section md-card">
      <h3>Content</h3>
      <div v-if="!isEditing">
        <div class="read-only-field">
          <div class="read-only-label">Business Name (Copyright)</div>
          <div class="read-only-value">{{ form.business_name || '-' }}</div>
        </div>
      </div>
      <div v-else>
        <div class="md-text-field">
          <input type="text" v-model="form.business_name" id="biz" />
          <label for="biz">Business Name</label>
        </div>
      </div>
      
      <div class="info-card-md">
        <p>Der Footer zeigt automatisch das aktuelle Jahr und die Links zum Impressum und Datenschutz an.</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.info-card-md { margin-top: 1.5rem; padding: 12px 16px; background: var(--md-surface-container); border-radius: 8px; font-family: var(--md-font-sans); font-size: 0.8125rem; color: var(--md-on-surface-variant); border: 1px solid var(--md-outline-variant); line-height: 1.5; }
</style>
