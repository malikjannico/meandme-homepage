<script setup>
import { ref, onMounted, watch } from 'vue'
import { supabase } from '../../../lib/supabase'
import { useContentStore } from '../../../stores/content'

const props = defineProps({ isEditing: Boolean })
const emit = defineEmits(['saved', 'error', 'saving'])

const contentStore = useContentStore()

const uploadingLogo = ref(false)
const logoUrl = ref('')
const socials = ref({ instagram: '', facebook: '' })
const originalSocials = ref({})

function loadData() {
  if (contentStore.settings) {
    logoUrl.value = contentStore.settings.logo_url
    
    // Extract from social_links array
    const links = contentStore.settings.social_links || []
    const ig = links.find(l => l.platform === 'instagram')?.url || ''
    const fb = links.find(l => l.platform === 'facebook')?.url || ''
    
    socials.value = {
      instagram: ig,
      facebook: fb
    }
    originalSocials.value = JSON.parse(JSON.stringify(socials.value))
  }
}

onMounted(loadData)
watch(() => contentStore.settings, loadData, { deep: true })

function cancelEdit() {
  socials.value = JSON.parse(JSON.stringify(originalSocials.value))
}

async function handleLogoUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  uploadingLogo.value = true
  try {
    const fileName = `${Date.now()}_logo`
    await supabase.storage.from('meandme_assets').upload(`logos/${fileName}`, file)
    const { data: { publicUrl } } = supabase.storage.from('meandme_assets').getPublicUrl(`logos/${fileName}`)
    await supabase.from('site_settings').update({ logo_url: publicUrl }).eq('id', 1)
    await contentStore.fetchAllData()
    emit('saved', 'Logo aktualisiert')
  } catch (e) { alert(e.message) } finally { uploadingLogo.value = false }
}

async function saveAll() {
  emit('saving', true)
  try {
    // Construct the social_links array
    const newLinks = [
      { platform: 'instagram', url: socials.value.instagram },
      { platform: 'facebook', url: socials.value.facebook }
    ]

    await supabase.from('site_settings').update({
      social_links: newLinks
    }).eq('id', 1)
    
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
      <div class="header-content-grid">
        <!-- Logo -->
        <div class="logo-mgmt">
           <div class="view-label">Website Logo</div>
           <div class="logo-box">
             <img :src="logoUrl || '/images/meandme_logo.svg'" />
           </div>
           <label v-if="isEditing" class="btn-upload-logo-md">
             <input type="file" @change="handleLogoUpload" accept="image/*" class="hidden" />
             <span>{{ uploadingLogo ? '...' : 'Logo ändern' }}</span>
           </label>
        </div>

        <!-- Socials -->
        <div class="socials-mgmt">
           <div class="view-label">Social Media</div>
           <div v-if="!isEditing" class="socials-view-list">
             <div class="social-row-md"><strong>Instagram:</strong> {{ socials.instagram || '-' }}</div>
             <div class="social-row-md"><strong>Facebook:</strong> {{ socials.facebook || '-' }}</div>
           </div>
           <div v-else class="socials-edit-form">
              <div class="socials-spacer"></div>
              <div class="md-text-field"><input type="url" v-model="socials.instagram" id="ig" /><label for="ig">Instagram URL</label></div>
              <div class="md-text-field"><input type="url" v-model="socials.facebook" id="fb" /><label for="fb">Facebook URL</label></div>
           </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.header-content-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 3rem; }
.logo-box { width: 100%; max-width: 200px; aspect-ratio: 2/1; background: var(--md-surface-container); border-radius: 8px; display: flex; align-items: center; justify-content: center; padding: 1rem; margin: 0.75rem 0; border: 1px solid var(--md-outline-variant); }
.logo-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
.btn-upload-logo-md { display: block; width: fit-content; padding: 8px 20px; background: var(--md-primary); color: white; border-radius: 18px; font-family: var(--md-font-sans); font-size: 0.8125rem; cursor: pointer; font-weight: 500; transition: filter 0.15s; }
.btn-upload-logo-md:hover { filter: brightness(1.05); }
.view-label { font-family: var(--md-font-sans); font-size: 0.6875rem; text-transform: uppercase; color: var(--md-on-surface-variant); font-weight: 500; letter-spacing: 0.05em; }
.social-row-md { font-family: var(--md-font-sans); font-size: 0.875rem; margin: 0.75rem 0; padding-bottom: 0.75rem; border-bottom: 1px solid var(--md-outline-variant); color: var(--md-on-surface); }
.social-row-md strong { font-weight: 600; color: var(--md-on-surface-variant); font-size: 0.8125rem; }
.hidden { display: none; }
@media (max-width: 768px) { 
  .header-content-grid { grid-template-columns: 1fr; gap: 1.5rem; }
  .social-row-md { display: flex; flex-direction: column; gap: 4px; padding-top: 0.5rem; }
  .socials-spacer { height: 0.75rem; }
}
</style>
