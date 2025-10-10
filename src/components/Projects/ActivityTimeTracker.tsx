import React, { useEffect, useState } from 'react';
import { Play, Pause, Square, Clock, Users } from 'lucide-react';
import { Button } from '../UI/Button';
import { useAuth } from '../../context/AuthContext';
import {
  startActivityTimer,
  pauseActivityTimer,
  stopActivityTimer,
  resumeActivityTimer,
  getActivityTimeStats,
  formatTimeDisplay
} from '../../lib/timeTracking';
import type { UserTimeStats, Activity } from '../../types';
import { useNotification } from '../../context/NotificationContext';

interface ActivityTimeTrackerProps {
  activity: Activity;
  onTimeUpdate: () => void;
}

export function ActivityTimeTracker({ activity, onTimeUpdate }: ActivityTimeTrackerProps) {
  const { user: currentUser, hasPermission } = useAuth();
  const { toast, confirm } = useNotification();
  const [userStats, setUserStats] = useState<UserTimeStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const isAdmin = hasPermission('canManageUsers');
  const isGestor = currentUser?.authLevel === 'gestor';
  const canSeeAllTimes = isAdmin || isGestor;

  const loadTimeStats = async () => {
    const stats = await getActivityTimeStats(activity.id);
    setUserStats(stats);
  };

  useEffect(() => {
    loadTimeStats();
    const interval = setInterval(loadTimeStats, 5000);
    return () => clearInterval(interval);
  }, [activity.id]);

  useEffect(() => {
    const myStats = userStats.find(s => s.userId === currentUser?.id);
    if (myStats?.activeEntry) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - myStats.activeEntry!.startedAt.getTime()) / 1000);
        setCurrentTime(myStats.activeEntry!.durationSeconds + elapsed);
      }, 1000);
      return () => clearInterval(interval);
    } else if (myStats) {
      setCurrentTime(myStats.totalSeconds);
    }
  }, [userStats, currentUser?.id]);

  if (!currentUser) return null;

  const myStats = userStats.find(s => s.userId === currentUser.id);
  const isMyTimerActive = myStats?.activeEntry?.isActive || false;

  const handleStartTimer = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const hasOtherActiveTimer = userStats.some(
        s => s.userId === currentUser.id && s.activeEntry && s.activeEntry.activityId !== activity.id
      );

      if (hasOtherActiveTimer) {
        const confirmed = await confirm({
          title: 'Timer Ativo',
          message: 'Você já tem um timer ativo em outra atividade. Deseja pausar e iniciar este?',
          type: 'warning',
          confirmText: 'Sim, trocar timer',
          cancelText: 'Cancelar'
        });

        if (!confirmed) {
          setIsLoading(false);
          return;
        }
      }

      await resumeActivityTimer(activity.id, currentUser.id);
      await loadTimeStats();
      onTimeUpdate();
      toast.success('Timer iniciado');
    } catch (error) {
      toast.error('Erro ao iniciar timer');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePauseTimer = async () => {
    if (isLoading || !myStats?.activeEntry) return;
    setIsLoading(true);

    try {
      await pauseActivityTimer(myStats.activeEntry.id, currentUser.id);
      await loadTimeStats();
      onTimeUpdate();
      toast.success('Timer pausado');
    } catch (error) {
      toast.error('Erro ao pausar timer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopTimer = async () => {
    if (isLoading || !myStats?.activeEntry) return;

    const confirmed = await confirm({
      title: 'Parar Timer',
      message: 'Tem certeza que deseja parar o timer? Esta ação finalizará a contagem.',
      type: 'warning',
      confirmText: 'Sim, parar',
      cancelText: 'Cancelar'
    });

    if (!confirmed) return;

    setIsLoading(true);

    try {
      await stopActivityTimer(myStats.activeEntry.id, currentUser.id);
      await loadTimeStats();
      onTimeUpdate();
      toast.success('Timer parado');
    } catch (error) {
      toast.error('Erro ao parar timer');
    } finally {
      setIsLoading(false);
    }
  };

  const totalTime = userStats.reduce((sum, stat) => sum + stat.totalSeconds, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            <div>
              <div className="text-sm font-medium text-gray-700">Meu Tempo</div>
              <div className="text-lg font-bold text-gray-900">
                {formatTimeDisplay(isMyTimerActive ? currentTime : (myStats?.totalSeconds || 0))}
              </div>
            </div>
          </div>

          {canSeeAllTimes && totalTime > 0 && (
            <div className="flex items-center gap-2 pl-4 border-l border-gray-300">
              <Users className="h-5 w-5 text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-700">Tempo Total</div>
                <div className="text-lg font-bold text-gray-900">
                  {formatTimeDisplay(totalTime)}
                </div>
              </div>
            </div>
          )}
        </div>

        {activity.status !== 'completed' && (
          <div className="flex gap-2">
            {!isMyTimerActive ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartTimer}
                disabled={isLoading}
              >
                <Play className="h-4 w-4 mr-1" />
                {myStats && myStats.totalSeconds > 0 ? 'Continuar' : 'Iniciar'}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePauseTimer}
                  disabled={isLoading}
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Pausar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStopTimer}
                  disabled={isLoading}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <Square className="h-4 w-4 mr-1" />
                  Parar
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {canSeeAllTimes && userStats.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Tempo por Pessoa</h4>
          <div className="space-y-2">
            {userStats.map(stat => (
              <div key={stat.userId} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{stat.userName}</span>
                  {stat.activeEntry?.isActive && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-1 animate-pulse"></span>
                      Ativo
                    </span>
                  )}
                </div>
                <span className="font-mono text-gray-700">
                  {formatTimeDisplay(stat.totalSeconds)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
