<script>
  import { onMount } from 'svelte';
  import { createClient } from '@supabase/supabase-js';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
  import { Badge } from '$lib/components/ui/badge';
  import { AlertCircle, CheckCircle, Edit, Eye, Send, Zap, Target, Globe, FileText, BarChart3, Loader2, ArrowRight, MessageSquare, Lightbulb, Trash2 } from 'lucide-svelte';

  // NOTE: Em um projeto React/TS, o cliente Supabase seria importado de src/lib/supabase.ts
  // Para este exemplo Svelte, estamos simulando a inicialização.
  const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

  // --- STATE MANAGEMENT ---
  let drafts = [];
  let published = [];
  let loading = true;
  let generating = false;
  let currentDraft = null;
  let activeTab = 'drafts';
  let keyword = '';
  let context = 'maputo';
  let audience = 'vendedores';
  let contentType = 'guia-completo';

  // --- LIFECYCLE METHODS ---
  async function loadContent() {
    loading = true;
    try {
      // Buscar Rascunhos (status: draft)
      const { data: draftsData } = await supabase
        .from('content_drafts')
        .select('*')
        .eq('status', 'draft')
        .order('created_at', { ascending: false });
        
      // Buscar Publicados (status: published)
      const { data: publishedData } = await supabase
        .from('content_drafts') // Usando a mesma tabela para simplificar o exemplo
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      
      drafts = draftsData || [];
      published = publishedData || [];
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      loading = false;
    }
  }

  async function generateContent() {
    if (!keyword.trim()) {
      alert('Por favor, insira uma palavra-chave principal.');
      return;
    }

    generating = true;
    
    try {
      // Chamada para a Edge Function (Módulo 1)
      const response = await fetch('/functions/v1/content-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // NOTE: Em um ambiente real, o token seria injetado pelo AuthContext
          'Authorization': `Bearer ${supabase.auth.session()?.access_token}`,
        },
        body: JSON.stringify({
          action: 'generate',
          keyword: keyword.trim(),
          context,
          audience,
          type: contentType
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // O Realtime deve atualizar a lista, mas forçamos o load para feedback imediato
        await loadContent(); 
        alert(`Conteúdo gerado com sucesso! Rascunho ID: ${result.draftId}`);
        // Define o rascunho gerado como o rascunho atual para edição
        currentDraft = drafts.find(d => d.id === result.draftId) || null;
        activeTab = 'editor';
      } else {
        alert(`Erro: ${result.error}`);
      }
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Erro ao gerar conteúdo');
    } finally {
      generating = false;
    }
  }

  async function publishDraft(draftId) {
    if (!confirm('Tem certeza que deseja publicar este artigo?')) return;
    
    try {
      // Chamada para a Edge Function (Módulo 1)
      const response = await fetch('/functions/v1/content-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.session()?.access_token}`,
        },
        body: JSON.stringify({
          action: 'publish',
          draftId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        await loadContent();
        alert('Artigo publicado com sucesso!');
        activeTab = 'published';
      } else {
        alert(`Erro ao publicar: ${result.error}`);
      }
    } catch (error) {
      console.error('Error publishing draft:', error);
      alert('Erro ao publicar artigo');
    }
  }
  
  async function deleteDraft(draftId) {
    if (!confirm('Tem certeza que deseja excluir este rascunho?')) return;
    
    try {
      const { error } = await supabase
        .from('content_drafts')
        .delete()
        .eq('id', draftId);

      if (error) throw error;
      
      await loadContent();
      alert('Rascunho excluído com sucesso!');
    } catch (error) {
      console.error('Error deleting draft:', error);
      alert('Erro ao excluir rascunho');
    }
  }

  function editDraft(draft) {
    currentDraft = draft;
    activeTab = 'editor';
  }

  function viewSerp(draft) {
    // Simulação de SERP Preview
    const serpUrl = `https://www.google.com/search?q=${encodeURIComponent(draft.title)}`;
    window.open(serpUrl, '_blank');
  }

  // --- REALTIME SUBSCRIPTION ---
  onMount(async () => {
    await loadContent();
    
    // NOTE: O filtro de usuário deve ser adicionado em um ambiente real
    const channel = supabase
      .channel('content_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'content_drafts' },
        (payload) => {
          console.log('🔄 Realtime update:', payload);
          loadContent();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  });

  // --- HELPER FUNCTIONS ---
  function formatDate(dateString) {
    return new Intl.DateTimeFormat('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  }

  function getSeoColor(score) {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  }

  function handleDraftUpdate(field, value) {
    if (currentDraft) {
      currentDraft = { ...currentDraft, [field]: value };
    }
  }
  
  async function saveDraftChanges() {
    if (!currentDraft) return;
    
    try {
      const { error } = await supabase
        .from('content_drafts')
        .update(currentDraft)
        .eq('id', currentDraft.id);
        
      if (error) throw error;
      alert('Rascunho salvo com sucesso!');
      await loadContent();
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Erro ao salvar rascunho');
    }
  }

  // --- COMPONENT RENDER ---
</script>

<main class="p-6 bg-gray-50 min-h-screen">
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 flex items-center">
        <Zap class="w-8 h-8 mr-3 text-yellow-600" />
        Gerenciador de Conteúdo Profissional
      </h1>
      <p class="text-gray-600">Crie e gerencie artigos otimizados para SEO local e Google Discover</p>
    </div>

    <!-- Generation Controls -->
    <Card class="mb-8 border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle class="flex items-center text-green-800">
          <Target class="w-6 h-6 mr-2" />
          Motor de Conteúdo Nível Profissional
        </CardTitle>
        <p class="text-sm text-green-700">Gere conteúdo otimizado para SEO local, Google Discover e o mercado moçambicano</p>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Palavra-chave Principal</label>
            <Input bind:value={keyword} placeholder="Ex: vender eletrônicos online" />
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Público-Alvo</label>
            <select bind:value={audience} class="w-full p-2 border rounded-md">
              <option value="vendedores">Vendedores e Empreendedores</option>
              <option value="clientes">Consumidores e Compradores</option>
              <option value="geral">Público Geral</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Tipo de Conteúdo</label>
            <select bind:value={contentType} class="w-full p-2 border rounded-md">
              <option value="guia-completo">Guia Completo</option>
              <option value="dicas-praticas">Dicas Práticas</option>
              <option value="tendencias">Análise de Tendências</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Contexto Local</label>
            <select bind:value={context} class="w-full p-2 border rounded-md">
              <option value="maputo">Maputo e Região</option>
              <option value="beira">Beira e Sofala</option>
              <option value="nampula">Nampula e Norte</option>
              <option value="nacional">Nacional (Todo MZ)</option>
            </select>
          </div>
        </div>
        
        <Button 
          on:click={generateContent} 
          disabled={generating || !keyword.trim()}
          class="w-full bg-green-600 hover:bg-green-700 text-white"
          size="lg"
        >
          {#if generating}
            <div class="flex items-center">
              <Loader2 class="w-5 h-5 mr-2 animate-spin" />
              Gerando conteúdo...
            </div>
          {:else}
            <Zap class="w-5 h-5 mr-2" />
            Gerar Artigo Hiper-Localizado
          {/if}
        </Button>
      </CardContent>
    </Card>

    <!-- Content Management Tabs -->
    <Tabs bind:value={activeTab} on:change={(e) => activeTab = e.detail.value}>
      <TabsList class="grid w-full grid-cols-3 h-auto p-1">
        <TabsTrigger value="drafts">Rascunhos ({drafts.length})</TabsTrigger>
        <TabsTrigger value="published">Publicados ({published.length})</TabsTrigger>
        <TabsTrigger value="editor">Editor</TabsTrigger>
      </TabsList>

      <!-- Drafts Tab -->
      <TabsContent value="drafts">
        <div class="space-y-4">
          {#if loading}
            <div class="flex justify-center h-32">
              <LoadingSpinner />
            </div>
          {:else if drafts.length === 0}
            <Card>
              <CardContent class="p-12 text-center">
                <FileText class="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 class="text-xl font-semibold text-gray-900 mb-2">Nenhum rascunho</h2>
                <p class="text-gray-600">Gere seu primeiro artigo com IA</p>
              </CardContent>
            </Card>
          {:else}
            {#each drafts as draft (draft.id)}
              <Card class="hover:shadow-lg transition-shadow">
                <CardContent class="p-6">
                  <div class="flex justify-between items-start mb-4">
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900">{draft.title}</h3>
                      <p class="text-sm text-gray-600">Palavra-chave: {draft.keyword}</p>
                    </div>
                    <div class="flex space-x-2">
                      <Badge variant="secondary" class="text-xs">
                        <FileText class="w-3 h-3 mr-1" />
                        {draft.audience}
                      </Badge>
                      <Badge variant="secondary" class="text-xs">
                        <Globe class="w-3 h-3 mr-1" />
                        {draft.context}
                      </Badge>
                    </div>
                  </div>
                  
                  <div class="flex justify-between items-center">
                    <div class="text-sm text-gray-600">
                      <div class="flex items-center">
                        <BarChart3 class="w-4 h-4 mr-1" />
                        SEO Score: <span class="font-bold {getSeoColor(draft.seo_score)}">{draft.seo_score}%</span>
                      </div>
                      <div class="text-xs text-gray-500 mt-1">
                        Criado em {formatDate(draft.created_at)}
                      </div>
                    </div>
                    
                    <div class="flex space-x-2">
                      <Button on:click={() => editDraft(draft)} size="sm" variant="outline">
                        <Edit class="w-4 h-4 mr-1" /> Revisar
                      </Button>
                      <Button on:click={() => publishDraft(draft.id)} size="sm" class="bg-green-600 hover:bg-green-700">
                        <Send class="w-4 h-4 mr-1" /> Publicar
                      </Button>
                      <Button on:click={() => deleteDraft(draft.id)} size="sm" variant="destructive">
                        <Trash2 class="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            {/each}
          {/else}
        </div>
      </TabsContent>

      <!-- Published Tab -->
      <TabsContent value="published">
        <div class="space-y-4">
          {#if loading}
            <div class="flex justify-center h-32">
              <LoadingSpinner />
            </div>
          {:else if published.length === 0}
            <Card>
              <CardContent class="p-12 text-center">
                <CheckCircle class="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h2 class="text-xl font-semibold text-gray-900 mb-2">Nenhum artigo publicado</h2>
                <p class="text-gray-600">Publique um rascunho para vê-lo aqui.</p>
              </CardContent>
            </Card>
          {:else}
            {#each published as post (post.id)}
              <Card class="hover:shadow-lg transition-shadow border-green-400">
                <CardContent class="p-6">
                  <div class="flex justify-between items-center">
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900">{post.title}</h3>
                      <p class="text-sm text-gray-600">Publicado em: {formatDate(post.published_at)}</p>
                    </div>
                    <div class="flex space-x-2">
                      <Button on:click={() => viewSerp(post)} size="sm" variant="outline">
                        <Eye class="w-4 h-4 mr-1" /> Ver SERP
                      </Button>
                      <Button on:click={() => editDraft(post)} size="sm" variant="secondary">
                        <Edit class="w-4 h-4 mr-1" /> Editar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            {/each}
          {/else}
        </div>
      </TabsContent>

      <!-- Editor Tab -->
      <TabsContent value="editor">
        {#if currentDraft}
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center text-blue-800">
                <Edit class="w-6 h-6 mr-2" />
                Editor Avançado: {currentDraft.title}
              </CardTitle>
              <div class="flex items-center space-x-4 text-sm">
                <Badge class="bg-yellow-100 text-yellow-800">
                  <BarChart3 class="w-3 h-3 mr-1" /> SEO Score: {currentDraft.seo_score}%
                </Badge>
                <Badge class="bg-blue-100 text-blue-800">
                  <Globe class="w-3 h-3 mr-1" /> Contexto: {currentDraft.context}
                </Badge>
              </div>
            </CardHeader>
            <CardContent class="space-y-6">
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">Título</label>
                <Input 
                  value={currentDraft.title} 
                  on:input={(e) => handleDraftUpdate('title', e.target.value)}
                />
              </div>
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">Meta Descrição</label>
                <Textarea 
                  value={currentDraft.meta_description} 
                  on:input={(e) => handleDraftUpdate('meta_description', e.target.value)}
                  rows="3"
                />
              </div>
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">Conteúdo (Markdown)</label>
                <Textarea 
                  value={currentDraft.content} 
                  on:input={(e) => handleDraftUpdate('content', e.target.value)}
                  rows="20"
                  class="font-mono"
                />
              </div>
              
              <div class="flex space-x-4">
                <Button on:click={saveDraftChanges} class="bg-blue-600 hover:bg-blue-700">
                  <CheckCircle class="w-4 h-4 mr-2" /> Salvar Rascunho
                </Button>
                <Button on:click={() => publishDraft(currentDraft.id)} class="bg-green-600 hover:bg-green-700">
                  <Send class="w-4 h-4 mr-2" /> Publicar Agora
                </Button>
                <Button on:click={() => activeTab = 'drafts'} variant="outline">
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        {:else}
          <Card>
            <CardContent class="p-12 text-center">
              <Edit class="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h2 class="text-xl font-semibold text-gray-900 mb-2">Selecione um rascunho para editar</h2>
              <p class="text-gray-600">Vá para a aba 'Rascunhos' ou gere um novo artigo.</p>
            </CardContent>
          </Card>
        {/if}
      </TabsContent>
    </Tabs>
  </div>
</main>