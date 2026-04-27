<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useContentStore } from '../stores/content';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();
const contentStore = useContentStore();
const carouselRef = ref(null);
let autoPlayInterval = null;

const collections = computed(() => {
    return [...contentStore.collections].sort((a, b) => a.display_order - b.display_order);
});

const collectionTitle = computed(() => {
    return contentStore.getSectionTitle('collection', locale.value);
});

const scroll = (direction) => {
    if (!carouselRef.value) return;
    const scrollAmount = carouselRef.value.offsetWidth;
    const maxScroll = carouselRef.value.scrollWidth - carouselRef.value.clientWidth;
    
    if (direction === 'right' && carouselRef.value.scrollLeft >= maxScroll - 5) {
        carouselRef.value.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (direction === 'left' && carouselRef.value.scrollLeft <= 5) {
        carouselRef.value.scrollTo({ left: maxScroll, behavior: 'smooth' });
    } else {
        carouselRef.value.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    }
};

const startAutoPlay = () => {
    autoPlayInterval = setInterval(() => {
        scroll('right');
    }, 8000);
};

const stopAutoPlay = () => {
    if (autoPlayInterval) clearInterval(autoPlayInterval);
};

onMounted(() => {
    startAutoPlay();
});

onUnmounted(() => {
    stopAutoPlay();
});
</script>

<template>
    <section class="section-container">
        <div class="title-line" id="collection">
            <h2>{{ collectionTitle }}</h2>
        </div>
        
        <div class="carousel-wrapper" @mouseenter="stopAutoPlay" @mouseleave="startAutoPlay">
            <button class="nav-btn prev" @click="scroll('left')" v-if="collections.length > 2">
                <img src="/images/left-arrow.svg" alt="Previous">
            </button>
            
            <div class="carousel-container" ref="carouselRef">
                <div v-for="item in collections" :key="item.id" class="collection-item">
                    <img :src="item.image_url" alt="Collection Image">
                </div>
            </div>

            <button class="nav-btn next" @click="scroll('right')" v-if="collections.length > 2">
                <img src="/images/right-arrow.svg" alt="Next">
            </button>
        </div>
    </section>
</template>

<style scoped>
.carousel-wrapper {
    position: relative;
    width: 100%;
}

.carousel-container {
    display: flex;
    gap: 0; /* Removed gap for seamless layout */
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    -ms-overflow-style: none;
    scroll-behavior: smooth;
    padding: 1rem 0;
}

.carousel-container::-webkit-scrollbar {
    display: none;
}

.collection-item {
    flex: 0 0 100%;
    scroll-snap-align: start;
}

.collection-item img {
    width: 100%;
    aspect-ratio: 3/4;
    object-fit: cover;
    border-radius: 0; /* Sharp edges */
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

@media (min-width: 768px) {
    .collection-item {
        flex: 0 0 50%; /* No gap compensation needed */
    }
}

.nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(222, 239, 239, 0.8);
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.nav-btn:hover {
    background: white;
    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
}

.nav-btn img {
    width: 20px;
    opacity: 0.6;
}

.prev { left: -20px; }
.next { right: -20px; }

@media (max-width: 1024px) {
    .prev { left: 0; }
    .next { right: 0; }
}

@media (max-width: 767px) {
    .nav-btn {
        display: none; /* Hide buttons on mobile in favor of swipe */
    }
    
    .carousel-container {
        padding: 1rem 0;
        /* Ensure images are slightly smaller so the next one is hinted */
    }
}
</style>
