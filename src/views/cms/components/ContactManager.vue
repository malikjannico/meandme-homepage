<script setup>
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { supabase } from '../../../lib/supabase'
import { useContentStore } from '../../../stores/content'

const props = defineProps({
  isEditing: Boolean
})
const emit = defineEmits(['saved', 'error', 'saving'])

const { t } = useI18n()
const contentStore = useContentStore()

const form = ref({
  title_en: '',
  title_de: '',
  contact_text: ''
})

const originalData = ref({})

function loadData() {
  if (contentStore.settings) {
    const section = contentStore.sectionTitles.find(s => s.section_key === 'contact')
    form.value = {
      title_en: section?.title_en || '',
      title_de: section?.title_de || '',
      contact_text: contentStore.settings.contact_text_de || ''
    }
    originalData.value = JSON.parse(JSON.stringify(form.value))
  }
}

onMounted(loadData)
watch(() => contentStore.settings, loadData, { deep: true })
watch(() => contentStore.sectionTitles, loadData, { deep: true })

function cancelEdit() {
  form.value = JSON.parse(JSON.stringify(originalData.value))
}

async function saveAll() {
  emit('saving', true)
  try {
    await supabase.from('section_titles').update({
      title_en: form.value.title_en,
      title_de: form.value.title_de
    }).eq('section_key', 'contact')
    
    await supabase.from('site_settings').update({
      contact_text_en: form.value.contact_text,
      contact_text_de: form.value.contact_text
    }).eq('id', 1)
    
    await contentStore.fetchAllData()
    emit('saved')
  } catch (e) {
    emit('error', e.message)
  } finally {
    emit('saving', false)
  }
}

defineExpose({ saveAll, cancelEdit })
</script>

<template>
  <div class="management-page">
    <!-- Überschrift Section -->
    <section class="edit-section md-card">
      <h3>Überschrift</h3>
      
      <div v-if="!isEditing" class="form-grid">
        <div class="read-only-field">
          <div class="read-only-label">Titel (EN)</div>
          <div class="read-only-value">{{ form.title_en || '-' }}</div>
        </div>
        <div class="read-only-field">
          <div class="read-only-label">Titel (DE)</div>
          <div class="read-only-value">{{ form.title_de || '-' }}</div>
        </div>
      </div>
      
      <div v-else class="form-grid">
        <div class="md-text-field">
          <input type="text" v-model="form.title_en" id="title_en" />
          <label for="title_en">Titel (EN)</label>
        </div>
        <div class="md-text-field">
          <input type="text" v-model="form.title_de" id="title_de" />
          <label for="title_de">Titel (DE)</label>
        </div>
      </div>
    </section>

    <!-- Content Section -->
    <section class="edit-section md-card">
      <h3>Content</h3>
      
      <div v-if="!isEditing" class="contact-view-md">
        <div class="contact-homepage-preview">
          <div class="contact-text-preview">
            <p>{{ form.contact_text }}</p>
          </div>
        </div>
      </div>
      
      <div v-else>
        <div class="md-text-field">
          <textarea v-model="form.contact_text" rows="8" id="contact_text"></textarea>
          <label for="contact_text">Kontakt Text</label>
        </div>
        
        <div class="preview-section">
          <div class="gallery-label">Homepage Vorschau</div>
          <div class="contact-homepage-preview">
            <div class="contact-text-preview">
              <p>{{ form.contact_text }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.preview-section {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px dashed var(--md-outline);
}

.gallery-label { 
    font-family: var(--md-font-sans); 
    font-size: 0.6875rem; 
    text-transform: uppercase; 
    font-weight: 500; 
    color: var(--md-on-surface-variant);
    margin-bottom: 0.75rem;
}

.contact-homepage-preview {
    background-color: #deefef;
    padding: 4rem 2rem;
    text-align: center;
    border-radius: 0;
}

.contact-text-preview {
    max-width: 800px;
    margin: 0 auto;
}

.contact-text-preview p {
    font-family: 'Raleway', sans-serif;
    font-size: 1.1rem;
    line-height: 1.8;
    color: #575756;
    white-space: pre-line;
}

@media (max-width: 768px) {
  .form-grid { grid-template-columns: 1fr; gap: 0; }
}
</style>
