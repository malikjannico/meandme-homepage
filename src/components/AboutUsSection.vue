<script setup>
import { computed } from 'vue';
import { useContentStore } from '../stores/content';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();
const contentStore = useContentStore();

const aboutTitle = computed(() => {
    return contentStore.getSectionTitle('about_us', locale.value);
});

const aboutText = computed(() => {
    if (!contentStore.settings) return '';
    return locale.value === 'de' ? contentStore.settings.about_us_text_de : contentStore.settings.about_us_text_en;
});
</script>

<template>
    <section class="section-container">
        <div class="title-line" id="about">
            <h2>{{ aboutTitle }}</h2>
        </div>
        
        <div class="about-content">
            <div class="about-text-body ql-editor" v-html="aboutText"></div>
            <img class="profile-img" :src="contentStore.settings?.about_us_image_url || '/images/IMG_2003.jpg'" alt="Anja Jäger & Silke Press">
        </div>
    </section>
</template>

<style scoped>
.about-text-body.ql-editor {
    margin-bottom: 2rem;
    text-align: center;
}
</style>
