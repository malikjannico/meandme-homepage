<script setup>
import { onMounted, ref, watch, onBeforeUnmount } from 'vue';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Inhalt hier eingeben...' }
});

const emit = defineEmits(['update:modelValue']);

const editorContainer = ref(null);
let quill = null;

onMounted(() => {
  quill = new Quill(editorContainer.value, {
    theme: 'snow',
    placeholder: props.placeholder,
    modules: {
      toolbar: [
        [{ 'header': [1, 2, false] }],
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'clean']
      ]
    }
  });

  // Set initial content
  if (props.modelValue) {
    quill.root.innerHTML = props.modelValue;
  }

  // Handle changes
  quill.on('text-change', () => {
    const html = quill.root.innerHTML;
    // Don't emit if it's just an empty paragraph (Quill default)
    const value = html === '<p><br></p>' ? '' : html;
    emit('update:modelValue', value);
  });
});

// Watch for external changes
watch(() => props.modelValue, (newVal) => {
  if (quill && newVal !== quill.root.innerHTML) {
    quill.root.innerHTML = newVal || '';
  }
});

onBeforeUnmount(() => {
  if (quill) {
    quill = null;
  }
});
</script>

<template>
  <div class="rich-text-editor-wrapper">
    <div ref="editorContainer" class="quill-editor"></div>
  </div>
</template>

<style>
/* Scoped styles don't work well with Quill themes, so we use global-ish styles or deep selectors */
.rich-text-editor-wrapper {
  margin-top: 0.5rem;
  background: var(--md-surface);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--md-outline);
}

.quill-editor {
  min-height: 200px;
  font-family: var(--md-font-sans);
}

.ql-toolbar.ql-snow {
  border: none;
  border-bottom: 1px solid var(--md-outline-variant);
  background: var(--md-surface-container);
  padding: 8px 12px;
}

.ql-container.ql-snow {
  border: none;
  font-family: var(--md-font-sans);
  font-size: 0.875rem;
}

.ql-editor {
  min-height: 200px;
  line-height: 1.6;
  color: var(--md-on-surface);
}

.ql-editor p {
  margin-bottom: 0;
}

.ql-editor p:last-child {
  margin-bottom: 0;
}

.ql-editor.ql-blank::before {
  color: var(--md-on-surface-variant);
  font-style: normal;
  opacity: 0.5;
}

/* Material adjustments for Quill */
.ql-snow .ql-stroke { stroke: var(--md-on-surface-variant); }
.ql-snow .ql-fill { fill: var(--md-on-surface-variant); }
.ql-snow .ql-picker { color: var(--md-on-surface-variant); font-family: var(--md-font-sans); }
.ql-snow .ql-active .ql-stroke { stroke: var(--md-primary); }
.ql-snow .ql-active .ql-fill { fill: var(--md-primary); }
.ql-snow .ql-active { color: var(--md-primary); }
</style>
