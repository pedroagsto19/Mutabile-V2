import React, { useState } from 'react';
import { Modal } from '../UI/Modal';
import { Search, Book, Video, MessageCircle, ExternalLink } from 'lucide-react';
import { Input } from '../UI/Input';

interface HelpCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HelpTopic {
  id: string;
  title: string;
  description: string;
  category: 'getting-started' | 'projects' | 'clients' | 'suppliers' | 'advanced';
  icon: React.ReactNode;
}

const helpTopics: HelpTopic[] = [
  {
    id: '1',
    title: 'Primeiros Passos',
    description: 'Aprenda a criar seu primeiro projeto e adicionar atividades',
    category: 'getting-started',
    icon: <Book className="h-5 w-5" />
  },
  {
    id: '2',
    title: 'Gestão de Projetos',
    description: 'Como organizar etapas, atividades e acompanhar o progresso',
    category: 'projects',
    icon: <Book className="h-5 w-5" />
  },
  {
    id: '3',
    title: 'Clientes e Funil Comercial',
    description: 'Gerencie leads, propostas e acompanhe o funil de vendas',
    category: 'clients',
    icon: <Book className="h-5 w-5" />
  },
  {
    id: '4',
    title: 'Avaliação de Fornecedores',
    description: 'Registre e avalie fornecedores para melhor tomada de decisão',
    category: 'suppliers',
    icon: <Book className="h-5 w-5" />
  },
  {
    id: '5',
    title: 'Atalhos de Teclado',
    description: 'Use atalhos para trabalhar mais rápido: N (novo), Ctrl+S (salvar), Ctrl+F (buscar)',
    category: 'advanced',
    icon: <Book className="h-5 w-5" />
  },
];

const faqItems = [
  {
    question: 'Como criar um novo projeto?',
    answer: 'Clique no botão "Novo Projeto" na tela de Gestão de Projetos ou pressione a tecla "N". Preencha as informações básicas e escolha as etapas desejadas.'
  },
  {
    question: 'Como reorganizar as etapas de um projeto?',
    answer: 'No formulário de criação do projeto, após adicionar as etapas, você pode arrastar e soltar para reorganizá-las no modal de ordenação.'
  },
  {
    question: 'Como avaliar um fornecedor?',
    answer: 'Acesse o fornecedor desejado e clique em "Nova Avaliação". Preencha as notas de qualidade, prazo e preço, além de indicar se recomenda o fornecedor.'
  },
  {
    question: 'Como acompanhar o progresso de atividades?',
    answer: 'Na tela de detalhamento do projeto, cada atividade mostra seu progresso em percentual. Use o cronômetro para rastrear o tempo dedicado a cada atividade.'
  },
];

export function HelpCenter({ isOpen, onClose }: HelpCenterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'topics' | 'faq'>('topics');

  const filteredTopics = helpTopics.filter(topic =>
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFaq = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Central de Ajuda">
      <div className="space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar ajuda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>

        <div className="flex space-x-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('topics')}
            className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'topics'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Tópicos de Ajuda
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'faq'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Perguntas Frequentes
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-3">
          {activeTab === 'topics' ? (
            filteredTopics.length > 0 ? (
              filteredTopics.map(topic => (
                <div
                  key={topic.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                      {topic.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">
                        {topic.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {topic.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhum tópico encontrado</p>
              </div>
            )
          ) : (
            filteredFaq.length > 0 ? (
              filteredFaq.map((item, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <h3 className="font-medium text-gray-900 mb-2">
                    {item.question}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {item.answer}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhuma pergunta encontrada</p>
              </div>
            )
          )}
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">
            Precisa de mais ajuda?
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
              onClick={() => alert('Vídeos tutoriais estarão disponíveis em breve')}
            >
              <Video className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Vídeos Tutoriais</span>
            </button>
            <button
              className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
              onClick={() => alert('Chat com suporte estará disponível em breve')}
            >
              <MessageCircle className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Contatar Suporte</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
