export type FirstRoundStarterRule = 'doubleSix' | 'highestDouble';
export type SubsequentRoundStarterRule = 'previousRoundWinner' | 'clockwise';
export type BlockedScoringRule = 'opponentsPips' | 'pipDifference';

export interface GameRulesConfig {
  readonly targetScore: number;
  readonly firstRoundStarter: FirstRoundStarterRule;
  readonly subsequentRoundStarter: SubsequentRoundStarterRule;
  readonly blockedScoringMethod: BlockedScoringRule;
  readonly allowPassOnlyWhenNoMoves: boolean;
  readonly handSize: number;
}

export const DEFAULT_RULES: GameRulesConfig = {
  targetScore: 100,
  firstRoundStarter: 'doubleSix',
  subsequentRoundStarter: 'previousRoundWinner',
  blockedScoringMethod: 'opponentsPips',
  allowPassOnlyWhenNoMoves: true,
  handSize: 7
};
