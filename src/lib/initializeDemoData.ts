import { supabase, hasValidSession } from './supabase';
import LocalStorage from './localStorage';

export async function initializeDemoData() {
  try {
    console.log('Inicializando dados demo...');
    
    // Sempre inicializar atividades padrão primeiro
    LocalStorage.initializeDefaultActivities();
    
    // Garantir que as etapas padrão existam no sistema de atividades padrão
    const saved = localStorage.getItem('mutabile_default_activities');
    if (!saved) {
      LocalStorage.initializeDefaultActivities();
    } else {
      // Verificar se todas as etapas padrão existem
      const stageActivities = JSON.parse(saved);
      const existingStageNames = stageActivities.map((sa: any) => sa.stageName);
      const defaultStageNames = ['Anteprojeto', 'Projeto Legal', 'Projeto Executivo', 'Planejamento'];
      
      let needsUpdate = false;
      const updatedStageActivities = [...stageActivities];
      
      defaultStageNames.forEach(stageName => {
        if (!existingStageNames.includes(stageName)) {
          updatedStageActivities.push({
            stageName,
            activities: []
          });
          needsUpdate = true;
        }
      });
      
      if (needsUpdate) {
        localStorage.setItem('mutabile_default_activities', JSON.stringify(updatedStageActivities));
      }
    }
    
    // Verificar se já existem usuários no localStorage
    const existingUsers = LocalStorage.getUsers();
    
    if (existingUsers.length > 0) {
      console.log('Dados demo já existem, mas garantindo atividades padrão...');
      
      // Sempre garantir que as atividades padrão existam
      LocalStorage.initializeDefaultActivities();
      
      // Adicionar atividades de exemplo aos projetos existentes
      LocalStorage.addSampleActivitiesToExistingProjects();
      return;
    }
    
    // Inicializar dados padrão no localStorage
    LocalStorage.initializeDefaultData();
    
    // Inicializar atividades padrão
    LocalStorage.initializeDefaultActivities();
    
    // Adicionar atividades de exemplo
    LocalStorage.addSampleActivitiesToExistingProjects();
    
    console.log('Dados demo criados com sucesso');
    
  } catch (e: any) {
    console.error('initializeDemoData error:', e);
    throw new Error(`Falha ao inicializar dados: ${e?.message || 'erro desconhecido'}`);
  }
}