import { supabase } from './supabase';
import type { User } from '../types/auth';
import type { Project, Stage, Activity, ActivityDependency, ChecklistItem, DriveLink } from '../types';
import type { Supplier, SupplierEvaluation } from '../types/supplier';
import type { Client, Proposal, CommercialActivity } from '../types/client';
import type { Notification, NotificationPreferences } from '../types/notification';

// Helper function to get current user ID
const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || null;
};

// User operations
export const userOperations = {
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        name: userData.name,
        email: userData.email,
        role: userData.role,
        auth_level: userData.authLevel,
        team_id: userData.teamId,
        manager_id: userData.managerId,
        created_by: await getCurrentUserId()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      authLevel: data.auth_level,
      teamId: data.team_id,
      managerId: data.manager_id,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async update(id: string, updates: Partial<User>): Promise<void> {
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.email) updateData.email = updates.email;
    if (updates.role) updateData.role = updates.role;
    if (updates.authLevel) updateData.auth_level = updates.authLevel;
    if (updates.teamId) updateData.team_id = updates.teamId;
    if (updates.managerId) updateData.manager_id = updates.managerId;

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id);
    
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Project operations
export const projectOperations = {
  async getAll(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        stages (
          *,
          activities (
            *,
            activity_dependencies!activity_dependencies_activity_id_fkey (
              id,
              depends_on_activity_id,
              dependency_type
            ),
            checklist_items (*),
            drive_links (*)
          )
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(project => ({
      id: project.id,
      name: project.name,
      client: project.client,
      location: project.location,
      responsible: project.responsible,
      controlNumber: project.control_number || '',
      description: project.description || '',
      status: project.status,
      progress: project.progress,
      risk: project.risk,
      nextDeadline: project.next_deadline ? new Date(project.next_deadline) : undefined,
      createdAt: new Date(project.created_at),
      updatedAt: new Date(project.updated_at),
      stages: (project.stages || []).map((stage: any) => ({
        id: stage.id,
        name: stage.name,
        projectId: stage.project_id,
        order: stage.order_number,
        progress: stage.progress,
        status: stage.status,
        notificationRecipients: stage.notification_recipients || [],
        isCustom: stage.is_custom,
        activities: (stage.activities || []).map((activity: any) => ({
          id: activity.id,
          title: activity.title,
          description: activity.description || '',
          responsible: activity.responsible || '',
          priority: activity.priority,
          plannedStartDate: new Date(activity.planned_start_date),
          plannedEndDate: new Date(activity.planned_end_date),
          actualStartDate: activity.actual_start_date ? new Date(activity.actual_start_date) : undefined,
          actualEndDate: activity.actual_end_date ? new Date(activity.actual_end_date) : undefined,
          plannedDuration: activity.planned_duration,
          actualDuration: activity.actual_duration,
          progress: activity.progress,
          status: activity.status,
          stageId: activity.stage_id,
          isTimerActive: activity.is_timer_active,
          timerStartTime: activity.timer_start_time ? new Date(activity.timer_start_time) : undefined,
          dependencies: (activity.activity_dependencies || []).map((dep: any) => ({
            id: dep.id,
            dependsOn: dep.depends_on_activity_id,
            type: dep.dependency_type
          })),
          checklist: (activity.checklist_items || []).map((item: any) => ({
            id: item.id,
            title: item.title,
            completed: item.completed,
            createdAt: new Date(item.created_at)
          })),
          driveLinks: (activity.drive_links || []).map((link: any) => ({
            id: link.id,
            title: link.title,
            url: link.url,
            description: link.description,
            createdAt: new Date(link.created_at)
          }))
        }))
      }))
    }));
  },

  async create(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const userId = await getCurrentUserId();
    
    // Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert([{
        name: projectData.name,
        client: projectData.client,
        location: projectData.location,
        responsible: projectData.responsible,
        control_number: projectData.controlNumber,
        description: projectData.description,
        status: projectData.status,
        progress: projectData.progress,
        risk: projectData.risk,
        next_deadline: projectData.nextDeadline?.toISOString(),
        created_by: userId
      }])
      .select()
      .single();
    
    if (projectError) throw projectError;

    // Create stages and activities
    for (const stageData of projectData.stages) {
      const { data: stage, error: stageError } = await supabase
        .from('stages')
        .insert([{
          name: stageData.name,
          project_id: project.id,
          order_number: stageData.order,
          progress: stageData.progress,
          status: stageData.status,
          notification_recipients: stageData.notificationRecipients,
          is_custom: stageData.isCustom
        }])
        .select()
        .single();
      
      if (stageError) throw stageError;

      // Create activities for this stage
      for (const activityData of stageData.activities) {
        const { data: activity, error: activityError } = await supabase
          .from('activities')
          .insert([{
            title: activityData.title,
            description: activityData.description,
            responsible: activityData.responsible,
            priority: activityData.priority,
            planned_start_date: activityData.plannedStartDate.toISOString(),
            planned_end_date: activityData.plannedEndDate.toISOString(),
            actual_start_date: activityData.actualStartDate?.toISOString(),
            actual_end_date: activityData.actualEndDate?.toISOString(),
            planned_duration: activityData.plannedDuration,
            actual_duration: activityData.actualDuration,
            progress: activityData.progress,
            status: activityData.status,
            stage_id: stage.id,
            is_timer_active: activityData.isTimerActive,
            timer_start_time: activityData.timerStartTime?.toISOString()
          }])
          .select()
          .single();
        
        if (activityError) throw activityError;

        // Create checklist items
        if (activityData.checklist && activityData.checklist.length > 0) {
          const checklistItems = activityData.checklist.map(item => ({
            activity_id: activity.id,
            title: item.title,
            completed: item.completed
          }));

          const { error: checklistError } = await supabase
            .from('checklist_items')
            .insert(checklistItems);
          
          if (checklistError) throw checklistError;
        }

        // Create drive links
        if (activityData.driveLinks && activityData.driveLinks.length > 0) {
          const driveLinks = activityData.driveLinks.map(link => ({
            activity_id: activity.id,
            title: link.title,
            url: link.url,
            description: link.description
          }));

          const { error: driveLinksError } = await supabase
            .from('drive_links')
            .insert(driveLinks);
          
          if (driveLinksError) throw driveLinksError;
        }

        // Create dependencies (after all activities are created)
        if (activityData.dependencies && activityData.dependencies.length > 0) {
          // Note: Dependencies need to be created after all activities exist
          // This might require a second pass or different approach
        }
      }
    }

    // Return the created project with all related data
    return await this.getById(project.id);
  },

  async getById(id: string): Promise<Project> {
    const projects = await this.getAll();
    const project = projects.find(p => p.id === id);
    if (!project) throw new Error('Project not found');
    return project;
  },

  async update(id: string, updates: Partial<Project>): Promise<void> {
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.client) updateData.client = updates.client;
    if (updates.location) updateData.location = updates.location;
    if (updates.responsible) updateData.responsible = updates.responsible;
    if (updates.controlNumber) updateData.control_number = updates.controlNumber;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.status) updateData.status = updates.status;
    if (updates.progress !== undefined) updateData.progress = updates.progress;
    if (updates.risk) updateData.risk = updates.risk;
    if (updates.nextDeadline !== undefined) updateData.next_deadline = updates.nextDeadline?.toISOString();

    const { error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id);
    
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Activity operations
export const activityOperations = {
  async update(id: string, updates: Partial<Activity>): Promise<void> {
    const updateData: any = {};
    if (updates.title) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.responsible !== undefined) updateData.responsible = updates.responsible;
    if (updates.priority) updateData.priority = updates.priority;
    if (updates.plannedStartDate) updateData.planned_start_date = updates.plannedStartDate.toISOString();
    if (updates.plannedEndDate) updateData.planned_end_date = updates.plannedEndDate.toISOString();
    if (updates.actualStartDate !== undefined) updateData.actual_start_date = updates.actualStartDate?.toISOString();
    if (updates.actualEndDate !== undefined) updateData.actual_end_date = updates.actualEndDate?.toISOString();
    if (updates.plannedDuration !== undefined) updateData.planned_duration = updates.plannedDuration;
    if (updates.actualDuration !== undefined) updateData.actual_duration = updates.actualDuration;
    if (updates.progress !== undefined) updateData.progress = updates.progress;
    if (updates.status) updateData.status = updates.status;
    if (updates.isTimerActive !== undefined) updateData.is_timer_active = updates.isTimerActive;
    if (updates.timerStartTime !== undefined) updateData.timer_start_time = updates.timerStartTime?.toISOString();

    const { error } = await supabase
      .from('activities')
      .update(updateData)
      .eq('id', id);
    
    if (error) throw error;

    // Update checklist items if provided
    if (updates.checklist) {
      // Delete existing checklist items
      await supabase
        .from('checklist_items')
        .delete()
        .eq('activity_id', id);

      // Insert new checklist items
      if (updates.checklist.length > 0) {
        const checklistItems = updates.checklist.map(item => ({
          activity_id: id,
          title: item.title,
          completed: item.completed
        }));

        const { error: checklistError } = await supabase
          .from('checklist_items')
          .insert(checklistItems);
        
        if (checklistError) throw checklistError;
      }
    }
  }
};

// Supplier operations
export const supplierOperations = {
  async getAll(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select(`
        *,
        supplier_evaluations (*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(supplier => ({
      id: supplier.id,
      name: supplier.name,
      cnpj: supplier.cnpj,
      location: {
        city: supplier.city,
        state: supplier.state,
        country: supplier.country
      },
      website: supplier.website,
      mainContact: supplier.main_contact,
      description: supplier.description,
      observations: supplier.observations,
      ratings: {
        quality: supplier.quality_rating,
        price: supplier.price_rating,
        recommendation: supplier.recommendation_rating
      },
      evaluations: (supplier.supplier_evaluations || []).map((evaluation: any) => ({
        id: evaluation.id,
        supplierId: evaluation.supplier_id,
        projectId: evaluation.project_id,
        projectName: evaluation.project_name,
        evaluationDate: new Date(evaluation.evaluation_date),
        ratings: {
          quality: evaluation.quality_rating,
          price: evaluation.price_rating,
          recommendation: evaluation.recommendation_rating
        },
        notes: evaluation.notes,
        evaluatedBy: evaluation.evaluated_by,
        createdAt: new Date(evaluation.created_at)
      })),
      linkedProjects: supplier.linked_projects || [],
      createdAt: new Date(supplier.created_at),
      updatedAt: new Date(supplier.updated_at),
      createdBy: supplier.created_by
    }));
  },

  async create(supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'evaluations'>): Promise<Supplier> {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('suppliers')
      .insert([{
        name: supplierData.name,
        cnpj: supplierData.cnpj,
        city: supplierData.location.city,
        state: supplierData.location.state,
        country: supplierData.location.country,
        website: supplierData.website,
        main_contact: supplierData.mainContact,
        description: supplierData.description,
        observations: supplierData.observations,
        quality_rating: supplierData.ratings.quality,
        price_rating: supplierData.ratings.price,
        recommendation_rating: supplierData.ratings.recommendation,
        linked_projects: supplierData.linkedProjects,
        created_by: userId
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      cnpj: data.cnpj,
      location: {
        city: data.city,
        state: data.state,
        country: data.country
      },
      website: data.website,
      mainContact: data.main_contact,
      description: data.description,
      observations: data.observations,
      ratings: {
        quality: data.quality_rating,
        price: data.price_rating,
        recommendation: data.recommendation_rating
      },
      evaluations: [],
      linkedProjects: data.linked_projects || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      createdBy: data.created_by
    };
  },

  async update(id: string, updates: Partial<Supplier>): Promise<void> {
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.cnpj !== undefined) updateData.cnpj = updates.cnpj;
    if (updates.location) {
      if (updates.location.city !== undefined) updateData.city = updates.location.city;
      if (updates.location.state !== undefined) updateData.state = updates.location.state;
      if (updates.location.country !== undefined) updateData.country = updates.location.country;
    }
    if (updates.website !== undefined) updateData.website = updates.website;
    if (updates.mainContact !== undefined) updateData.main_contact = updates.mainContact;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.observations !== undefined) updateData.observations = updates.observations;
    if (updates.ratings) {
      if (updates.ratings.quality !== undefined) updateData.quality_rating = updates.ratings.quality;
      if (updates.ratings.price !== undefined) updateData.price_rating = updates.ratings.price;
      if (updates.ratings.recommendation !== undefined) updateData.recommendation_rating = updates.ratings.recommendation;
    }
    if (updates.linkedProjects !== undefined) updateData.linked_projects = updates.linkedProjects;

    const { error } = await supabase
      .from('suppliers')
      .update(updateData)
      .eq('id', id);
    
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async addEvaluation(supplierId: string, evaluationData: Omit<SupplierEvaluation, 'id' | 'supplierId' | 'createdAt'>): Promise<void> {
    const userId = await getCurrentUserId();
    
    const { error } = await supabase
      .from('supplier_evaluations')
      .insert([{
        supplier_id: supplierId,
        project_id: evaluationData.projectId,
        project_name: evaluationData.projectName,
        evaluation_date: evaluationData.evaluationDate.toISOString(),
        quality_rating: evaluationData.ratings.quality,
        price_rating: evaluationData.ratings.price,
        recommendation_rating: evaluationData.ratings.recommendation,
        notes: evaluationData.notes,
        evaluated_by: userId
      }]);
    
    if (error) throw error;

    // Update supplier's average ratings
    const { data: evaluations } = await supabase
      .from('supplier_evaluations')
      .select('quality_rating, price_rating, recommendation_rating')
      .eq('supplier_id', supplierId);

    if (evaluations && evaluations.length > 0) {
      const avgQuality = Math.round(evaluations.reduce((sum, e) => sum + e.quality_rating, 0) / evaluations.length);
      const avgPrice = Math.round(evaluations.reduce((sum, e) => sum + e.price_rating, 0) / evaluations.length);
      const avgRecommendation = Math.round(evaluations.reduce((sum, e) => sum + e.recommendation_rating, 0) / evaluations.length);

      await supabase
        .from('suppliers')
        .update({
          quality_rating: avgQuality,
          price_rating: avgPrice,
          recommendation_rating: avgRecommendation
        })
        .eq('id', supplierId);
    }
  }
};

// Client operations
export const clientOperations = {
  async getAll(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(client => ({
      id: client.id,
      name: client.name,
      document: client.document,
      documentType: client.document_type,
      email: client.email,
      phone: client.phone,
      address: {
        street: client.street,
        number: client.number,
        complement: client.complement,
        neighborhood: client.neighborhood,
        city: client.city,
        state: client.state,
        zipCode: client.zip_code
      },
      funnelStage: client.funnel_stage,
      totalTimeSpent: parseFloat(client.total_time_spent || '0'),
      createdAt: new Date(client.created_at),
      updatedAt: new Date(client.updated_at),
      createdBy: client.created_by
    }));
  },

  async create(clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'totalTimeSpent'>): Promise<Client> {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('clients')
      .insert([{
        name: clientData.name,
        document: clientData.document,
        document_type: clientData.documentType,
        email: clientData.email,
        phone: clientData.phone,
        street: clientData.address.street,
        number: clientData.address.number,
        complement: clientData.address.complement,
        neighborhood: clientData.address.neighborhood,
        city: clientData.address.city,
        state: clientData.address.state,
        zip_code: clientData.address.zipCode,
        funnel_stage: clientData.funnelStage,
        total_time_spent: 0,
        created_by: userId
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      document: data.document,
      documentType: data.document_type,
      email: data.email,
      phone: data.phone,
      address: {
        street: data.street,
        number: data.number,
        complement: data.complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        zipCode: data.zip_code
      },
      funnelStage: data.funnel_stage,
      totalTimeSpent: parseFloat(data.total_time_spent || '0'),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      createdBy: data.created_by
    };
  },

  async update(id: string, updates: Partial<Client>): Promise<void> {
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.document) updateData.document = updates.document;
    if (updates.documentType) updateData.document_type = updates.documentType;
    if (updates.email) updateData.email = updates.email;
    if (updates.phone) updateData.phone = updates.phone;
    if (updates.address) {
      if (updates.address.street) updateData.street = updates.address.street;
      if (updates.address.number) updateData.number = updates.address.number;
      if (updates.address.complement !== undefined) updateData.complement = updates.address.complement;
      if (updates.address.neighborhood) updateData.neighborhood = updates.address.neighborhood;
      if (updates.address.city) updateData.city = updates.address.city;
      if (updates.address.state) updateData.state = updates.address.state;
      if (updates.address.zipCode) updateData.zip_code = updates.address.zipCode;
    }
    if (updates.funnelStage) updateData.funnel_stage = updates.funnelStage;
    if (updates.totalTimeSpent !== undefined) updateData.total_time_spent = updates.totalTimeSpent;

    const { error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id);
    
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Proposal operations
export const proposalOperations = {
  async getByClientId(clientId: string): Promise<Proposal[]> {
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(proposal => ({
      id: proposal.id,
      clientId: proposal.client_id,
      description: proposal.description,
      value: parseFloat(proposal.value || '0'),
      status: proposal.status,
      notes: proposal.notes,
      createdAt: new Date(proposal.created_at),
      updatedAt: new Date(proposal.updated_at),
      createdBy: proposal.created_by
    }));
  },

  async create(proposalData: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<Proposal> {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('proposals')
      .insert([{
        client_id: proposalData.clientId,
        description: proposalData.description,
        value: proposalData.value,
        status: proposalData.status,
        notes: proposalData.notes,
        created_by: userId
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      clientId: data.client_id,
      description: data.description,
      value: parseFloat(data.value || '0'),
      status: data.status,
      notes: data.notes,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      createdBy: data.created_by
    };
  },

  async update(id: string, updates: Partial<Proposal>): Promise<void> {
    const updateData: any = {};
    if (updates.description) updateData.description = updates.description;
    if (updates.value !== undefined) updateData.value = updates.value;
    if (updates.status) updateData.status = updates.status;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { error } = await supabase
      .from('proposals')
      .update(updateData)
      .eq('id', id);
    
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('proposals')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Commercial activity operations
export const commercialActivityOperations = {
  async getByClientId(clientId: string): Promise<CommercialActivity[]> {
    const { data, error } = await supabase
      .from('commercial_activities')
      .select('*')
      .eq('client_id', clientId)
      .order('activity_date', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(activity => ({
      id: activity.id,
      clientId: activity.client_id,
      type: activity.type,
      description: activity.description,
      timeSpent: parseFloat(activity.time_spent || '0'),
      date: new Date(activity.activity_date),
      notes: activity.notes,
      createdAt: new Date(activity.created_at),
      createdBy: activity.created_by
    }));
  },

  async create(activityData: Omit<CommercialActivity, 'id' | 'createdAt' | 'createdBy'>): Promise<CommercialActivity> {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('commercial_activities')
      .insert([{
        client_id: activityData.clientId,
        type: activityData.type,
        description: activityData.description,
        time_spent: activityData.timeSpent,
        activity_date: activityData.date.toISOString(),
        notes: activityData.notes,
        created_by: userId
      }])
      .select()
      .single();
    
    if (error) throw error;

    // Update client's total time spent
    await this.updateClientTotalTime(activityData.clientId);
    
    return {
      id: data.id,
      clientId: data.client_id,
      type: data.type,
      description: data.description,
      timeSpent: parseFloat(data.time_spent || '0'),
      date: new Date(data.activity_date),
      notes: data.notes,
      createdAt: new Date(data.created_at),
      createdBy: data.created_by
    };
  },

  async update(id: string, updates: Partial<CommercialActivity>): Promise<void> {
    const updateData: any = {};
    if (updates.type) updateData.type = updates.type;
    if (updates.description) updateData.description = updates.description;
    if (updates.timeSpent !== undefined) updateData.time_spent = updates.timeSpent;
    if (updates.date) updateData.activity_date = updates.date.toISOString();
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { error } = await supabase
      .from('commercial_activities')
      .update(updateData)
      .eq('id', id);
    
    if (error) throw error;

    // Update client's total time spent if time changed
    if (updates.timeSpent !== undefined || updates.clientId) {
      const { data: activity } = await supabase
        .from('commercial_activities')
        .select('client_id')
        .eq('id', id)
        .single();
      
      if (activity) {
        await this.updateClientTotalTime(activity.client_id);
      }
    }
  },

  async delete(id: string): Promise<void> {
    // Get client ID before deleting
    const { data: activity } = await supabase
      .from('commercial_activities')
      .select('client_id')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('commercial_activities')
      .delete()
      .eq('id', id);
    
    if (error) throw error;

    // Update client's total time spent
    if (activity) {
      await this.updateClientTotalTime(activity.client_id);
    }
  },

  async updateClientTotalTime(clientId: string): Promise<void> {
    const { data: activities } = await supabase
      .from('commercial_activities')
      .select('time_spent')
      .eq('client_id', clientId);

    const totalTime = (activities || []).reduce((sum, activity) => 
      sum + parseFloat(activity.time_spent || '0'), 0
    );

    await supabase
      .from('clients')
      .update({ total_time_spent: totalTime })
      .eq('id', clientId);
  }
};

// Notification operations
export const notificationOperations = {
  async getByUserId(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      importance: notification.importance,
      userId: notification.user_id,
      isRead: notification.is_read,
      isFixed: notification.is_fixed,
      relatedProjectId: notification.related_project_id,
      relatedActivityId: notification.related_activity_id,
      readAt: notification.read_at ? new Date(notification.read_at) : undefined,
      createdAt: new Date(notification.created_at)
    }));
  },

  async create(notificationData: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        importance: notificationData.importance,
        user_id: notificationData.userId,
        is_fixed: notificationData.isFixed,
        related_project_id: notificationData.relatedProjectId,
        related_activity_id: notificationData.relatedActivityId
      }]);
    
    if (error) throw error;
  },

  async markAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', id);
    
    if (error) throw error;
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Default activities operations
export const defaultActivityOperations = {
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from('default_activities')
      .select('*')
      .order('stage_name', { ascending: true });
    
    if (error) throw error;
    
    // Group by stage name
    const grouped: { [stageName: string]: any[] } = {};
    (data || []).forEach(activity => {
      if (!grouped[activity.stage_name]) {
        grouped[activity.stage_name] = [];
      }
      grouped[activity.stage_name].push({
        id: activity.id,
        title: activity.title,
        description: activity.description,
        plannedDuration: activity.planned_duration,
        priority: activity.priority,
        checklist: activity.checklist_items || [],
        driveLinks: activity.drive_links || [],
        dependencies: activity.dependencies || []
      });
    });

    return Object.entries(grouped).map(([stageName, activities]) => ({
      stageName,
      activities
    }));
  },

  async create(stageName: string, activityData: any): Promise<void> {
    const { error } = await supabase
      .from('default_activities')
      .insert([{
        stage_name: stageName,
        title: activityData.title,
        description: activityData.description,
        planned_duration: activityData.plannedDuration,
        priority: activityData.priority,
        checklist_items: activityData.checklist || [],
        drive_links: activityData.driveLinks || [],
        dependencies: activityData.dependencies || []
      }]);
    
    if (error) throw error;
  },

  async update(id: string, updates: any): Promise<void> {
    const updateData: any = {};
    if (updates.title) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.plannedDuration !== undefined) updateData.planned_duration = updates.plannedDuration;
    if (updates.priority) updateData.priority = updates.priority;
    if (updates.checklist !== undefined) updateData.checklist_items = updates.checklist;
    if (updates.driveLinks !== undefined) updateData.drive_links = updates.driveLinks;
    if (updates.dependencies !== undefined) updateData.dependencies = updates.dependencies;

    const { error } = await supabase
      .from('default_activities')
      .update(updateData)
      .eq('id', id);
    
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('default_activities')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};