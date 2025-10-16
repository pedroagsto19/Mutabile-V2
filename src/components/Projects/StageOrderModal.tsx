import React, { useState } from 'react';
import { GripVertical, Check } from 'lucide-react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { Project } from '../../types';

interface StageOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onSaveOrder: (orderedStages: string[]) => void;
}

const StageOrderModal: React.FC<StageOrderModalProps> = ({
  isOpen,
  onClose,
  project,
  onSaveOrder
}) => {
  const [orderedStages, setOrderedStages] = useState<string[]>(
    [...project.stages].sort((a, b) => a.order - b.order).map(stage => stage.name)
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...orderedStages];
    const draggedItem = newOrder[draggedIndex];

    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);

    setOrderedStages(newOrder);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = () => {
    onSaveOrder(orderedStages);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ordenar Etapas do Projeto">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Arraste as etapas para definir a ordem em que aparecerão no projeto.
        </p>

        <div className="space-y-2">
          {orderedStages.map((stageName, index) => (
            <div
              key={stageName}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-4 bg-white border-2 rounded-lg cursor-move transition-all ${
                draggedIndex === index
                  ? 'border-black shadow-lg scale-105 opacity-50'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <GripVertical className="h-5 w-5 text-gray-400 flex-shrink-0" />

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-black text-white text-xs font-medium">
                    {index + 1}
                  </span>
                  <h3 className="font-medium text-gray-900">{stageName}</h3>
                </div>
              </div>

              {project.stages.find(s => s.name === stageName)?.isCustom && (
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                  Personalizada
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="bg-black text-white hover:bg-gray-800"
          >
            <Check className="h-4 w-4 mr-2" />
            Confirmar Ordem
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default StageOrderModal;
