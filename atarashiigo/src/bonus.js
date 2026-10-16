// 表示文言・問い合わせの選択肢・くじの設定はここで編集できます。
export const TIP_BONUS = 1_000_000_000_000.5;
export const SHARE_BONUS = 6.5;
export const LOTTERY_UNLOCK = 5;
export const LOTTERY_COST = 10;
export const LOTTERY_PRIZES = [
  { label: '大当たり', amount: 1_000_000, displayChance: '50%', weight: 0 },
  { label: '小当たり', amount: 12, displayChance: '30%', weight: 30 },
  { label: 'はずれ', amount: 0, displayChance: '20%', weight: 70 },
];
// id は処理用です。label と reply は自由に書き換えられます。
export const CONTACT_TOPICS = [
  { id: 'secrets', label: '隠し要素について', items: [
    { id: 'remaining', label: '隠し要素はありますか', reply: 'もうありません。' },
  ] },
  { id: 'author', label: '作者について', items: [
    { id: 'profile', label: '作者はどんな人ですか', reply: 'にくまきと申します。Xで謎解きゲームなどを公開しています。\nX: @nikumakare' },
    { id: 'other', label: 'ほかの作品について', reply: 'Xで謎解きゲームなどを公開しています。にくまきと申します。' },
  ] },
  { id: 'support', label: '応援について', items: [
    { id: 'message', label: '応援の言葉を送りたい', reply: '応援ありがとうございます。励みになります。' },
    { id: 'share', label: 'ゲームを紹介したい', reply: 'ご紹介いただけるとうれしいです。' },
  ] },
  { id: 'stream', label: '配信について', items: [
    { id: 'permission', label: '配信してもよいですか', reply: '動画サイトでの配信・実況を歓迎しています。' },
    { id: 'credit', label: 'クレジットについて', reply: 'ゲーム名とURLを添えていただけるとうれしいです。' },
  ] },
  { id: 'lottery', label: 'コミくじについて', items: [
    { id: 'how', label: 'コミくじの引き方', reply: '対局終了後に、1回10目で引けます。' },
    { id: 'odds', label: '確率がおかしい', reply: '【お詫び】コミくじにおいて実態と異なる確率表示がなされていることが判明しました。この度は大変ご迷惑をおかけし、大変ご迷惑をおかけしました。' },
    { id: 'prize', label: '当選したコミについて', reply: '当選したコミは自動で次回の対局から使用できます。' },
  ] },
];
export function freshBonus() { return { komi: 0, unlocked: false, tipClaimed: false, lotteryDraws: 0 }; }
export function scoreGame(boardCounts, komi) {
  const white = boardCounts.white + komi;
  return { ...boardCounts, whiteTotal: white, winner: white > boardCounts.black ? 'white' : white === boardCounts.black ? 'draw' : 'black' };
}
export function drawLottery(random = Math.random) {
  let roll = random() * LOTTERY_PRIZES.reduce((sum, prize) => sum + prize.weight, 0);
  for (const prize of LOTTERY_PRIZES) {
    if (roll < prize.weight) return prize;
    roll -= prize.weight;
  }
  return LOTTERY_PRIZES.at(-1);
}
