<script setup>
import { computed } from 'vue';
import { useContentStore } from '../stores/content';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();
const contentStore = useContentStore();

const inspirationTitle = computed(() => {
    return contentStore.getSectionTitle('inspiration', locale.value);
});

const images = computed(() => contentStore.inspirationImages);

const instagramUrl = computed(() => {
    const link = contentStore.settings?.social_links?.find(l => l.platform === 'instagram');
    return link ? link.url : 'https://www.instagram.com/meandme_official/';
});

const instagramHandle = computed(() => {
    return contentStore.settings?.instagram_account ? `@${contentStore.settings.instagram_account}` : '@meandme_official';
});
</script>

<template>
    <section class="section-container">
        <div class="title-line" id="inspiration">
            <h2>{{ inspirationTitle }}</h2>
        </div>

        <div class="insta-reference-container">
            <a :href="instagramUrl" target="_blank" class="insta-link">
                <img src="/images/instagram.svg" alt="Instagram" class="insta-icon">
                <span class="insta-handle">{{ instagramHandle }}</span>
            </a>
        </div>
        
        <div class="insta-grid">
            <div v-for="img in images" :key="img.id" class="insta-item">
                <img :src="img.image_url" alt="Inspiration Image">
            </div>
        </div>
    </section>
</template>

<style scoped>
.insta-reference-container {
    display: flex;
    justify-content: center;
    margin-top: -2rem;
    margin-bottom: 3rem;
}

.insta-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--text-color);
    text-decoration: none;
    opacity: 0.8;
    transition: all 0.3s ease;
    padding: 0.5rem 1rem;
    border-radius: 20px;
}

.insta-link:hover {
    opacity: 1;
    background-color: rgba(0, 0, 0, 0.03);
    transform: translateY(-1px);
}

.insta-icon {
    height: 18px;
    width: 18px;
}

.insta-handle {
    font-family: var(--font-body);
    font-size: 0.9rem;
    font-weight: 500;
    letter-spacing: 0.05em;
}

@media (max-width: 768px) {
    .insta-reference-container {
        margin-top: -1.5rem;
        margin-bottom: 2rem;
    }
    
    .insta-handle {
        font-size: 0.8rem;
    }
}
</style>
