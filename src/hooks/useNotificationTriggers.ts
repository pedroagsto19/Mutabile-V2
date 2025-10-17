import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import type { Project, Activity } from '../types';

export function useNotificationTriggers() {
  const { addNotification } = useNotification();
  const { user: currentUser, getAllUsers } = useAuth();
  const users = getAllUsers();

  const triggerProjectCreatedNotification = (project: Project, createdBy: string) => {
    if (!currentUser) return;

    // Get creator info
    const creator = users.find(u => u.id === createdBy);
    const creatorName = creator?.name || 'Usuário';

    // Send to all admins and gestors
    const adminsAndGestors = users.filter(u => 
      u.authLevel === 'admin' || u.authLevel === 'gestor'
    );

    adminsAndGestors.forEach(user => {
      if (user.id === currentUser.id) {
        addNotification({
          type: 'project_created',
          title: 'Novo projeto criado',
          message: `O projeto "${project.name}" foi criado por ${creatorName}`,
          importance: 'normal',
          userId: user.id,
          isFixed: false,
          relatedProjectId: project.id
        });
      }
    });

    // Also notify team members if they have activities assigned
    const teamMembers = users.filter(u => 
      u.authLevel === 'equipe' && 
      project.stages.some(stage => 
        stage.activities.some(activity => activity.responsible === u.name)
      )
    );

    teamMembers.forEach(user => {
      if (user.id === currentUser.id) {
        addNotification({
          type: 'project_created',
          title: 'Novo projeto com suas atividades',
          message: `O projeto "${project.name}" foi criado e você tem atividades atribuídas`,
          importance: 'high',
          userId: user.id,
          isFixed: false,
          relatedProjectId: project.id
        });
      }
    });
  };

  const triggerProjectAssignedNotification = (project: Project, responsibleName: string, assignedBy: string) => {
    if (!currentUser) return;

    // Find the responsible user
    const responsibleUser = users.find(u => u.name === responsibleName);
    if (!responsibleUser || responsibleUser.id !== currentUser.id) return;

    const assigner = users.find(u => u.id === assignedBy);
    const assignerName = assigner?.name || 'Usuário';

    addNotification({
      type: 'project_assigned',
      title: 'Você foi designado responsável por um projeto',
      message: `${assignerName} designou você como responsável pelo projeto "${project.name}"`,
      importance: 'special',
      userId: responsibleUser.id,
      isFixed: true, // Special notifications are fixed until read
      relatedProjectId: project.id
    });
  };

  const triggerActivityAssignedNotification = (
    activity: Activity, 
    project: Project, 
    responsibleName: string, 
    assignedBy: string
  ) => {
    if (!currentUser) return;

    // Find the responsible user
    const responsibleUser = users.find(u => u.name === responsibleName);
    if (!responsibleUser || responsibleUser.id !== currentUser.id) return;

    const assigner = users.find(u => u.id === assignedBy);
    const assignerName = assigner?.name || 'Usuário';

    addNotification({
      type: 'activity_assigned',
      title: 'Nova atividade atribuída',
      message: `${assignerName} atribuiu a atividade "${activity.title}" do projeto "${project.name}" para você`,
      importance: 'high',
      userId: responsibleUser.id,
      isFixed: false,
      relatedProjectId: project.id,
      relatedActivityId: activity.id
    });
  };

  return {
    triggerProjectCreatedNotification,
    triggerProjectAssignedNotification,
    triggerActivityAssignedNotification
  };
}