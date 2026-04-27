import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export const useContentStore = defineStore('content', () => {
  const settings = ref(null)
  const sectionTitles = ref([])
  const collections = ref([])
  const brands = ref([])
  const storesData = ref([])
  const inspirationImages = ref([])
  const loading = ref(true)

  async function fetchAllData() {
    loading.value = true
    try {
      const [
        { data: stgs },
        { data: titles },
        { data: colls },
        { data: brs },
        { data: strs },
        { data: strImgs },
        { data: inspImgs }
      ] = await Promise.all([
        supabase.from('site_settings').select('*').single(),
        supabase.from('section_titles').select('*'),
        supabase.from('collection_images').select('*').order('display_order', { ascending: true }),
        supabase.from('brands').select('*').order('display_order', { ascending: true }),
        supabase.from('stores').select('*').order('display_order', { ascending: true }),
        supabase.from('store_images').select('*').order('display_order', { ascending: true }),
        supabase.from('inspiration_images').select('*').order('display_order', { ascending: true })
      ])

      settings.value = stgs
      sectionTitles.value = titles
      collections.value = colls
      brands.value = brs
      
      // Merge store images into stores
      storesData.value = strs.map(store => ({
        ...store,
        images: strImgs.filter(img => img.store_id === store.id)
      }))
      inspirationImages.value = inspImgs

    } catch (e) {
      console.error('Error fetching data:', e)
    } finally {
      loading.value = false
    }
  }

  function getSectionTitle(key, locale) {
    const section = sectionTitles.value.find(s => s.section_key === key)
    if (!section) return key
    return locale === 'de' ? section.title_de : section.title_en
  }

  return { 
    settings, 
    sectionTitles, 
    collections, 
    brands, 
    storesData, 
    inspirationImages,
    loading, 
    fetchAllData,
    getSectionTitle
  }
})
