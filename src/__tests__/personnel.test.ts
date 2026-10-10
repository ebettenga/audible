import { PERSONNEL, sceneForPersonnel } from '@/src/data/personnel';
import { generateCards } from '@/src/training/cards';

describe('personnel packages', () => {
  it('defines common codes 21, 11, 12, 10, 22', () => {
    const codes = PERSONNEL.map((p) => p.code);
    expect(codes).toEqual(expect.arrayContaining(['21', '11', '12', '10', '22']));
  });

  it('backs + TEs + WRs always equals 5 skill players', () => {
    for (const p of PERSONNEL) {
      expect(p.backs + p.tightEnds + p.receivers).toBe(5);
    }
  });

  it('21 scene has FB+RB, one TE, two WRs', () => {
    const scene = sceneForPersonnel(PERSONNEL.find((p) => p.code === '21')!);
    const skill = scene.players.filter((pl) => pl.side === 'off' && !['LT', 'LG', 'C', 'RG', 'RT', 'QB'].includes(pl.position));
    const backs = skill.filter((pl) => pl.position === 'RB' || pl.position === 'FB');
    const tes = skill.filter((pl) => pl.position === 'TE' || pl.position === 'Y');
    const wrs = skill.filter((pl) => ['WR', 'X', 'Z', 'H'].includes(pl.position));
    expect(backs).toHaveLength(2);
    expect(tes).toHaveLength(1);
    expect(wrs).toHaveLength(2);
  });

  it('11 scene has one RB, one TE, three WRs', () => {
    const scene = sceneForPersonnel(PERSONNEL.find((p) => p.code === '11')!);
    const backs = scene.players.filter((pl) => pl.position === 'RB' || pl.position === 'FB');
    const tes = scene.players.filter((pl) => pl.position === 'TE' || pl.position === 'Y');
    const wrs = scene.players.filter((pl) => ['WR', 'X', 'Z', 'H'].includes(pl.position));
    expect(backs).toHaveLength(1);
    expect(tes).toHaveLength(1);
    expect(wrs).toHaveLength(3);
  });

  it('personnel training cards answer with codes', () => {
    const cards = generateCards('personnel');
    expect(cards.length).toBeGreaterThanOrEqual(PERSONNEL.length);
    expect(cards.every((c) => c.type === 'name-personnel')).toBe(true);
    expect(cards.map((c) => c.answer)).toEqual(expect.arrayContaining(['21', '11', '12']));
  });
});
