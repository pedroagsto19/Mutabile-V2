import type { Supplier } from '../types/supplier';

import type { SupplierEvaluation } from '../types/supplier';

export interface LocalSupplier {
  id: string;
  name: string;
  cnpj?: string;
  location: {
    city?: string;
    state?: string;
    country?: string;
  };
  website?: string;
  mainContact?: string;
  description?: string;
  observations?: string;
  ratings: {
    quality: number;
    price: number;
    recommendation: number;
  };
  evaluations: any[];
  linkedProjects: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

class SupplierStorage {
  private static SUPPLIERS_KEY = 'mutabile_suppliers';

  static initializeSampleSuppliers() {
    // Sempre reinicializar com dados realistas
    console.log('Inicializando fornecedores realistas...');

    const sampleSuppliers = [
      {
        id: 'supplier_001',
        name: 'Construtora Silva & Associados',
        cnpj: '12.345.678/0001-90',
        location: {
          city: 'São Paulo',
          state: 'SP',
          country: 'Brasil'
        },
        website: 'https://silvaassociados.com.br',
        mainContact: 'João Silva - (11) 99999-1234',
        description: 'Especializada em construção civil, reformas e acabamentos de alto padrão',
        observations: 'Excelente qualidade, sempre cumpre prazos. Trabalha com materiais premium.',
        ratings: {
          quality: 5,
          price: 4,
          recommendation: 5
        },
        evaluations: [],
        linkedProjects: [],
        createdAt: new Date('2024-01-15').toISOString(),
        updatedAt: new Date('2024-01-15').toISOString(),
        createdBy: 'demo_user'
      },
      {
        id: 'supplier_002',
        name: 'Marmoraria Pedra Nobre',
        cnpj: '23.456.789/0001-01',
        location: {
          city: 'Cachoeiro de Itapemirim',
          state: 'ES',
          country: 'Brasil'
        },
        website: 'https://pedranobre.com.br',
        mainContact: 'Maria Santos - (28) 98888-5678',
        description: 'Fornecimento e instalação de mármores, granitos e pedras naturais',
        observations: 'Melhor preço da região. Entrega rápida e instalação impecável.',
        ratings: {
          quality: 5,
          price: 5,
          recommendation: 5
        },
        evaluations: [],
        linkedProjects: [],
        createdAt: new Date('2024-02-10').toISOString(),
        updatedAt: new Date('2024-02-10').toISOString(),
        createdBy: 'demo_user'
      },
      {
        id: 'supplier_003',
        name: 'Elétrica Moderna Ltda',
        cnpj: '34.567.890/0001-12',
        location: {
          city: 'Rio de Janeiro',
          state: 'RJ',
          country: 'Brasil'
        },
        website: 'https://eletricamoderna.com.br',
        mainContact: 'Carlos Oliveira - (21) 97777-9012',
        description: 'Instalações elétricas residenciais e comerciais, automação predial',
        observations: 'Equipe muito técnica. Ótimo para projetos complexos de automação.',
        ratings: {
          quality: 5,
          price: 3,
          recommendation: 4
        },
        evaluations: [],
        linkedProjects: [],
        createdAt: new Date('2024-02-20').toISOString(),
        updatedAt: new Date('2024-02-20').toISOString(),
        createdBy: 'demo_user'
      },
      {
        id: 'supplier_004',
        name: 'Hidráulica Express',
        cnpj: '45.678.901/0001-23',
        location: {
          city: 'Belo Horizonte',
          state: 'MG',
          country: 'Brasil'
        },
        website: '',
        mainContact: 'Ana Costa - (31) 96666-3456',
        description: 'Serviços hidráulicos, instalação de tubulações e sistemas de água',
        observations: 'Preço justo, mas às vezes atrasa um pouco. Qualidade boa.',
        ratings: {
          quality: 4,
          price: 4,
          recommendation: 3
        },
        evaluations: [],
        linkedProjects: [],
        createdAt: new Date('2024-03-05').toISOString(),
        updatedAt: new Date('2024-03-05').toISOString(),
        createdBy: 'demo_user'
      },
      {
        id: 'supplier_005',
        name: 'Vidraçaria Cristal',
        cnpj: '56.789.012/0001-34',
        location: {
          city: 'Curitiba',
          state: 'PR',
          country: 'Brasil'
        },
        website: 'https://cristalvidros.com.br',
        mainContact: 'Roberto Lima - (41) 95555-7890',
        description: 'Vidros temperados, laminados, espelhos e esquadrias de alumínio',
        observations: 'Excelente para fachadas. Vidros de alta qualidade, mas preço elevado.',
        ratings: {
          quality: 5,
          price: 2,
          recommendation: 4
        },
        evaluations: [],
        linkedProjects: [],
        createdAt: new Date('2024-03-15').toISOString(),
        updatedAt: new Date('2024-03-15').toISOString(),
        createdBy: 'demo_user'
      },
      {
        id: 'supplier_006',
        name: 'Pisos & Revestimentos Paulista',
        cnpj: '67.890.123/0001-45',
        location: {
          city: 'Campinas',
          state: 'SP',
          country: 'Brasil'
        },
        website: 'https://pisospaulista.com.br',
        mainContact: 'Fernanda Alves - (19) 94444-2345',
        description: 'Cerâmicas, porcelanatos, pisos vinílicos e laminados',
        observations: 'Grande variedade de produtos. Bom atendimento e entrega pontual.',
        ratings: {
          quality: 4,
          price: 4,
          recommendation: 4
        },
        evaluations: [],
        linkedProjects: [],
        createdAt: new Date('2024-04-01').toISOString(),
        updatedAt: new Date('2024-04-01').toISOString(),
        createdBy: 'demo_user'
      },
      {
        id: 'supplier_007',
        name: 'Serralheria Ferro & Arte',
        cnpj: '78.901.234/0001-56',
        location: {
          city: 'Porto Alegre',
          state: 'RS',
          country: 'Brasil'
        },
        website: '',
        mainContact: 'Marcos Ferreira - (51) 93333-6789',
        description: 'Portões, grades, estruturas metálicas e trabalhos artísticos em ferro',
        observations: 'Trabalho artesanal excepcional. Demora um pouco mais, mas vale a pena.',
        ratings: {
          quality: 5,
          price: 3,
          recommendation: 5
        },
        evaluations: [],
        linkedProjects: [],
        createdAt: new Date('2024-04-10').toISOString(),
        updatedAt: new Date('2024-04-10').toISOString(),
        createdBy: 'demo_user'
      },
      {
        id: 'supplier_008',
        name: 'Tintas & Texturas Premium',
        cnpj: '89.012.345/0001-67',
        location: {
          city: 'Salvador',
          state: 'BA',
          country: 'Brasil'
        },
        website: 'https://tintaspremium.com.br',
        mainContact: 'Juliana Rocha - (71) 92222-4567',
        description: 'Tintas especiais, texturas decorativas e acabamentos diferenciados',
        observations: 'Produtos únicos no mercado. Ideal para projetos de alto padrão.',
        ratings: {
          quality: 5,
          price: 2,
          recommendation: 4
        },
        evaluations: [],
        linkedProjects: [],
        createdAt: new Date('2024-04-20').toISOString(),
        updatedAt: new Date('2024-04-20').toISOString(),
        createdBy: 'demo_user'
      },
      {
        id: 'supplier_009',
        name: 'Madeireira Amazônia Sustentável',
        cnpj: '90.123.456/0001-78',
        location: {
          city: 'Manaus',
          state: 'AM',
          country: 'Brasil'
        },
        website: 'https://amazoniasustentavel.com.br',
        mainContact: 'Pedro Amazonas - (92) 91111-8901',
        description: 'Madeiras certificadas, decks, estruturas e móveis sob medida',
        observations: 'Madeiras de excelente qualidade com certificação ambiental. Frete caro.',
        ratings: {
          quality: 5,
          price: 3,
          recommendation: 5
        },
        evaluations: [],
        linkedProjects: [],
        createdAt: new Date('2024-05-01').toISOString(),
        updatedAt: new Date('2024-05-01').toISOString(),
        createdBy: 'demo_user'
      },
      {
        id: 'supplier_010',
        name: 'Italian Marble Import',
        cnpj: '01.234.567/0001-89',
        location: {
          city: 'Miami',
          state: 'Florida',
          country: 'Estados Unidos'
        },
        website: 'https://italianmarbleimport.com',
        mainContact: 'Giuseppe Romano - +1 (305) 555-0123',
        description: 'Importação de mármores italianos, travertinos e pedras naturais europeias',
        observations: 'Produtos exclusivos e únicos. Processo de importação pode demorar 60-90 dias.',
        ratings: {
          quality: 5,
          price: 1,
          recommendation: 3
        },
        evaluations: [],
        linkedProjects: [],
        createdAt: new Date('2024-05-10').toISOString(),
        updatedAt: new Date('2024-05-10').toISOString(),
        createdBy: 'demo_user'
      }
    ];

    try {
      localStorage.setItem(this.SUPPLIERS_KEY, JSON.stringify(sampleSuppliers));
      console.log('Fornecedores de exemplo criados com sucesso!');
    } catch (error) {
      console.error('Erro ao criar fornecedores de exemplo:', error);
    }
  }

  static getSuppliers(): LocalSupplier[] {
    try {
      const suppliers = localStorage.getItem(this.SUPPLIERS_KEY);
      return suppliers ? JSON.parse(suppliers) : [];
    } catch (error) {
      console.error('Error getting suppliers:', error);
      return [];
    }
  }

  static saveSuppliers(suppliers: LocalSupplier[]) {
    try {
      localStorage.setItem(this.SUPPLIERS_KEY, JSON.stringify(suppliers));
    } catch (error) {
      console.error('Error saving suppliers:', error);
    }
  }

  static createSupplier(supplierData: Omit<LocalSupplier, 'id' | 'createdAt' | 'updatedAt'>): LocalSupplier {
    try {
      const suppliers = this.getSuppliers();
      const newSupplier: LocalSupplier = {
        ...supplierData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      suppliers.push(newSupplier);
      this.saveSuppliers(suppliers);
      return newSupplier;
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  }

  static updateSupplier(id: string, updates: Partial<LocalSupplier>): boolean {
    try {
      const suppliers = this.getSuppliers();
      const supplierIndex = suppliers.findIndex(s => s.id === id);
      
      if (supplierIndex === -1) return false;
      
      const updatedSupplier = { 
        ...suppliers[supplierIndex], 
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      suppliers[supplierIndex] = updatedSupplier;
      this.saveSuppliers(suppliers);
      return true;
    } catch (error) {
      console.error('Error updating supplier:', error);
      return false;
    }
  }

  static deleteSupplier(id: string): boolean {
    try {
      const suppliers = this.getSuppliers();
      const filteredSuppliers = suppliers.filter(s => s.id !== id);
      
      if (filteredSuppliers.length === suppliers.length) return false;
      
      this.saveSuppliers(filteredSuppliers);
      return true;
    } catch (error) {
      console.error('Error deleting supplier:', error);
      return false;
    }
  }
}

export default SupplierStorage;