<script lang="ts">
import { onMount } from 'svelte';
import YAML from 'yaml';

interface Practice {
  id: string;
  title: string;
  description: string;
  tags: string[];
  area: string;
  sources: { title: string; url: string }[];
  file: string;
  section: number;
  instruction: string;
}

let practices: Practice[] = [];
let error = '';
let search = '';
let selectedArea = 'All';
let selectedTag = '';
let areas: string[] = [];
let tags: string[] = [];

let selectedPractice: Practice | null = null;
let showModal = false;
let sidebarOpen = false;

function unique(arr: string[]) {
  return Array.from(new Set(arr)).sort();
}

function filterPractices() {
  let filtered = practices;
  if (selectedArea && selectedArea !== 'All') {
    filtered = filtered.filter(p => p.area === selectedArea);
  }
  if (selectedTag) {
    filtered = filtered.filter(p => p.tags.includes(selectedTag));
  }
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.tags && p.tags.some((t: string) => t.toLowerCase().includes(q))) ||
      (p.area && p.area.toLowerCase().includes(q)) ||
      p.instruction.toLowerCase().includes(q)
    );
  }
  return filtered;
}

function openModal(practice: Practice) {
  selectedPractice = practice;
  showModal = true;
  setTimeout(() => {
    const modal = document.getElementById('practice-modal');
    if (modal) modal.focus();
  }, 0);
}

function closeModal() {
  showModal = false;
  selectedPractice = null;
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeModal();
    sidebarOpen = false;
  }
}

function exportTo(format: 'yaml' | 'json' | 'csv' | 'instructions') {
  let data = filterPractices();
  let content = '';
  let mime = '';
  let filename = 'best-practices.' + format;

  if (format === 'yaml') {
    content = YAML.stringify(data);
    mime = 'application/x-yaml';
  } else if (format === 'json') {
    content = JSON.stringify(data, null, 2);
    mime = 'application/json';
  } else if (format === 'csv') {
    const replacer = (v: any) => (v === null || v === undefined ? '' : v);
    const header = ['id', 'title', 'description', 'area', 'tags', 'sources', 'file', 'section', 'instruction'];
    const rows = data.map(p => [
      p.id,
      p.title,
      p.description,
      p.area,
      p.tags.join(';'),
      p.sources.map(s => `${s.title} (${s.url})`).join('; '),
      p.file,
      p.section,
      p.instruction
    ]);
    content = [header.join(','), ...rows.map(row => row.map(replacer).map(v => '"' + String(v).replace(/"/g, '""') + '"').join(','))].join('\n');
    mime = 'text/csv';
  } else if (format === 'instructions') {
    content = data.map(p => p.instruction).join('\n\n');
    mime = 'text/plain';
    filename = 'best-practice-instructions.txt';
  }
  const blob = new Blob([content], { type: mime });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }, 0);
}

function selectArea(area: string) {
  selectedArea = area;
  sidebarOpen = false;
}

function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
}

onMount(async () => {
  try {
    const res = await fetch('/src/lib/data/practices.yaml');
    const text = await res.text();
    practices = YAML.parse(text) as Practice[];
    areas = unique(practices.map((p) => p.area));
    tags = unique(practices.flatMap((p) => p.tags));
  } catch (e) {
    error = 'Failed to load practices.yaml';
  }
});
</script>

<div class="flex min-h-screen">
  <!-- Sidebar -->
  <nav class="bg-gray-100 border-r w-64 p-6 hidden md:block">
    <div class="mb-4 font-bold text-lg">Areas</div>
    <ul class="space-y-2">
      <li>
        <button class="w-full text-left px-2 py-1 rounded hover:bg-blue-100 font-semibold {selectedArea === 'All' ? 'bg-blue-200' : ''}" on:click={() => selectArea('All')}>All</button>
      </li>
      {#each areas as area}
        <li>
          <button class="w-full text-left px-2 py-1 rounded hover:bg-blue-100 {selectedArea === area ? 'bg-blue-200' : ''}" on:click={() => selectArea(area)}>{area}</button>
        </li>
      {/each}
    </ul>
  </nav>
  <!-- Mobile sidebar toggle -->
  <button class="md:hidden fixed top-4 left-4 z-50 bg-blue-600 text-white rounded p-2 shadow-lg" aria-label="Open area navigation" on:click={toggleSidebar}>
    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
  </button>
  {#if sidebarOpen}
    <div class="fixed inset-0 z-40 bg-black bg-opacity-40" role="presentation" tabindex="0" on:click={() => sidebarOpen = false} on:keydown={(e) => e.key === 'Escape' && (sidebarOpen = false)}></div>
    <nav class="fixed top-0 left-0 z-50 bg-gray-100 border-r w-64 p-6 h-full shadow-lg">
      <div class="mb-4 font-bold text-lg">Areas</div>
      <ul class="space-y-2">
        <li>
          <button class="w-full text-left px-2 py-1 rounded hover:bg-blue-100 font-semibold {selectedArea === 'All' ? 'bg-blue-200' : ''}" on:click={() => selectArea('All')}>All</button>
        </li>
        {#each areas as area}
          <li>
            <button class="w-full text-left px-2 py-1 rounded hover:bg-blue-100 {selectedArea === area ? 'bg-blue-200' : ''}" on:click={() => selectArea(area)}>{area}</button>
          </li>
        {/each}
      </ul>
    </nav>
  {/if}
  <!-- Main content -->
  <main class="flex-1 p-6 max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold mb-6">Software Engineering Best Practices</h1>
    <div class="flex flex-wrap gap-4 mb-6">
      <input
        class="border rounded px-3 py-2 w-64"
        placeholder="Search best practices..."
        bind:value={search}
        aria-label="Search best practices"
      />
      <select class="border rounded px-3 py-2" bind:value={selectedTag} aria-label="Filter by tag">
        <option value="">All Tags</option>
        {#each tags as tag}
          <option value={tag}>{tag}</option>
        {/each}
      </select>
      <div class="flex gap-2 ml-auto">
        <button class="bg-gray-200 hover:bg-gray-300 rounded px-3 py-2 text-sm" on:click={() => exportTo('yaml')}>Export YAML</button>
        <button class="bg-gray-200 hover:bg-gray-300 rounded px-3 py-2 text-sm" on:click={() => exportTo('json')}>Export JSON</button>
        <button class="bg-gray-200 hover:bg-gray-300 rounded px-3 py-2 text-sm" on:click={() => exportTo('csv')}>Export CSV</button>
        <button class="bg-blue-200 hover:bg-blue-300 rounded px-3 py-2 text-sm font-semibold" on:click={() => exportTo('instructions')}>Export Instructions</button>
      </div>
    </div>
    {#if error}
      <div class="text-red-600">{error}</div>
    {:else}
      {#if filterPractices().length === 0}
        <div class="text-gray-500">No practices found.</div>
      {:else}
        <ul class="space-y-4">
          {#each filterPractices() as practice}
            <button type="button" class="w-full text-left p-4 border rounded shadow bg-white transition hover:bg-blue-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400" on:click={() => openModal(practice)} on:keydown={(e) => e.key === 'Enter' && openModal(practice)}>
              <div class="font-semibold text-lg">{practice.title}</div>
              <div class="text-sm text-gray-600 mb-2">{practice.description}</div>
              <div class="mb-1">
                <span class="font-bold">Area:</span> {practice.area}
              </div>
              <div class="mb-1">
                <span class="font-bold">Tags:</span>
                {#each practice.tags as tag, i}
                  <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">{tag}</span>{' '}
                {/each}
              </div>
              <div class="mb-1">
                <span class="font-bold">Sources:</span>
                <ul class="list-disc ml-6">
                  {#each practice.sources as src}
                    <li><a href={src.url} class="text-blue-600 underline" target="_blank">{src.title}</a></li>
                  {/each}
                </ul>
              </div>
              <div class="mb-1">
                <span class="font-bold">Instruction:</span>
                <p class="text-gray-600">{practice.instruction}</p>
              </div>
              <div class="text-xs text-gray-400">From {practice.file}, Section {practice.section}</div>
            </button>
          {/each}
        </ul>
      {/if}
    {/if}

    {#if showModal && selectedPractice}
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" role="dialog" aria-modal="true" aria-label="Practice Details" tabindex="-1" on:click={closeModal} on:keydown={handleKeydown}>
        <div id="practice-modal" class="bg-white rounded-lg shadow-lg max-w-xl w-full p-8 relative" role="document" on:click|stopPropagation>
          <button class="absolute top-3 right-3 text-gray-500 hover:text-black text-xl" aria-label="Close" on:click={closeModal}>&times;</button>
          <h2 class="text-2xl font-bold mb-2">{selectedPractice.title}</h2>
          <div class="mb-3 text-gray-600">{selectedPractice.description}</div>
          <div class="mb-2"><span class="font-bold">Area:</span> {selectedPractice.area}</div>
          <div class="mb-2"><span class="font-bold">Tags:</span>
            {#each selectedPractice.tags as tag}
              <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">{tag}</span>
            {/each}
          </div>
          <div class="mb-2"><span class="font-bold">Sources:</span>
            <ul class="list-disc ml-6">
              {#each selectedPractice.sources as src}
                <li><a href={src.url} class="text-blue-600 underline" target="_blank">{src.title}</a></li>
              {/each}
            </ul>
          </div>
          <div class="mb-2"><span class="font-bold">Instruction:</span> <p class="text-gray-600">{selectedPractice.instruction}</p></div>
          <div class="mb-2 text-xs text-gray-400">From {selectedPractice.file}, Section {selectedPractice.section}</div>
        </div>
      </div>
    {/if}
  </main>
</div>
