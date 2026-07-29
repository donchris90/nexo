import { DailyGameMission } from '../types';
import { walletService } from './WalletService';

export class DailyMissionsService {
  private missions: DailyGameMission[] = [
    {
      id: 'm1',
      title: '🎥 Live Explorer',
      description: 'Join 3 live broadcast rooms or party rooms',
      targetCount: 3,
      currentCount: 2,
      rewardType: 'POINTS',
      rewardAmount: 500,
      isClaimed: false,
      icon: 'Tv'
    },
    {
      id: 'm2',
      title: '🎁 Generous Supporter',
      description: 'Send 5 virtual gifts to live hosts',
      targetCount: 5,
      currentCount: 3,
      rewardType: 'COINS',
      rewardAmount: 50,
      isClaimed: false,
      icon: 'Gift'
    },
    {
      id: 'm3',
      title: '🎮 Arena Gamer',
      description: 'Play 2 games in the Games Hub or Live Room',
      targetCount: 2,
      currentCount: 2,
      rewardType: 'POINTS',
      rewardAmount: 1000,
      isClaimed: false,
      icon: 'Gamepad2'
    },
    {
      id: 'm4',
      title: '🏆 Match Winner',
      description: 'Win 1 match in Ludo, Uno, or Coin Battle',
      targetCount: 1,
      currentCount: 1,
      rewardType: 'POINTS',
      rewardAmount: 1500,
      isClaimed: false,
      icon: 'Trophy'
    },
    {
      id: 'm5',
      title: '🤝 Squad Creator',
      description: 'Invite a friend to play a multiplayer game',
      targetCount: 1,
      currentCount: 0,
      rewardType: 'POINTS',
      rewardAmount: 300,
      isClaimed: false,
      icon: 'UserPlus'
    },
    {
      id: 'm6',
      title: '✨ Creator Fan',
      description: 'Follow 1 new verified creator or host',
      targetCount: 1,
      currentCount: 1,
      rewardType: 'COINS',
      rewardAmount: 20,
      isClaimed: false,
      icon: 'Heart'
    }
  ];

  public getMissions(): DailyGameMission[] {
    return this.missions;
  }

  public async claimReward(missionId: string, userId: string): Promise<{ success: boolean; message: string }> {
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission) return { success: false, message: 'Mission not found' };
    if (mission.isClaimed) return { success: false, message: 'Reward already claimed today' };
    if (mission.currentCount < mission.targetCount) return { success: false, message: 'Mission not completed yet' };

    mission.isClaimed = true;

    if (mission.rewardType === 'POINTS') {
      await walletService.appendLedgerEntry({
        userId,
        type: 'GAME_WIN',
        currency: 'POINTS',
        amount: mission.rewardAmount,
        description: `Daily Mission Claimed: ${mission.title}`,
        status: 'COMPLETED',
        timestamp: new Date().toISOString()
      });
    } else if (mission.rewardType === 'COINS') {
      await walletService.appendLedgerEntry({
        userId,
        type: 'REWARD',
        currency: 'COINS',
        amount: mission.rewardAmount,
        description: `Daily Mission Claimed: ${mission.title}`,
        status: 'COMPLETED',
        timestamp: new Date().toISOString()
      });
    }

    return { success: true, message: `Claimed +${mission.rewardAmount} ${mission.rewardType}!` };
  }
}

export const dailyMissionsService = new DailyMissionsService();
