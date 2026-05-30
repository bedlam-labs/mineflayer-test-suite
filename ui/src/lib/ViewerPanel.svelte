<script lang="ts">
  import { onMount } from 'svelte';

  let viewerUrl = $state('');

  onMount(async () => {
    try {
      const res = await fetch('/api/config');
      const config = await res.json();
      viewerUrl = `http://localhost:${config.viewerPort}`;
    } catch {
      viewerUrl = 'http://localhost:26600';
    }
  });
</script>

<div class="viewer">
  {#if viewerUrl}
    <iframe
      src={viewerUrl}
      title="Prismarine Viewer"
      frameborder="0"
    ></iframe>
  {:else}
    <div class="loading">Connecting to viewer...</div>
  {/if}
</div>

<style>
  .viewer {
    width: 100%;
    height: 100%;
    background: #000;
  }

  iframe {
    width: 100%;
    height: 100%;
    border: none;
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #444;
    font-size: 13px;
  }
</style>
