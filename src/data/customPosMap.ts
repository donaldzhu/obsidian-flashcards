import type { JotobaPos } from '../types/dictTypes'

const adj = <T extends string>(type: T): Record<'Adjective', T> => ({ Adjective: type })
const noun = <T extends string>(type: T): Record<'Noun', T> => ({ Noun: type })
const verb = <T extends string | object>(type: T): Record<'Verb', T> => ({ Verb: type })
const uVerb = <T extends string>(type: T): { Verb: Record<'Godan', T> } => verb({ Godan: type })
const irrVerb = <T extends string>(type: T): { Verb: Record<'Irregular', T> } => verb({ Irregular: type })

const customPosMap = {
  'Pre-Noun Verb': adj('PreNounVerb'),
  'い-Adjective': adj('Keiyoushi'),
  'い-Adjective (いい/よい)': adj('KeiyoushiYoiIi'),
  'く-Adjective': adj('Ku'),
  'な-Adjective': adj('Na'),
  'Adjective (なり)': adj('Nari'),
  'Adjective (〜の)': adj('No'),
  'Pre-Noun Adjective': adj('PreNoun'),
  'しく-Adjective': adj('Shiku'),
  'たる-Adjective': adj('Taru'),
  Adverb: 'Adverb',
  'Adverb (〜と)': 'AdverbTo',
  Auxilary: 'Auxilary',
  'Auxilary Adjective': 'AuxilaryAdj',
  'Auxilary Verb': 'AuxilaryVerb',
  Conjunction: 'Conjunction',
  Counter: 'Counter',
  Expression: 'Expr',
  Interjection: 'Interjection',
  'Noun': noun('Normal'),
  'Noun (Prefix)': noun('Prefix'),
  'Noun (Suffix)': noun('Suffix'),
  Numeric: 'Numeric',
  Pronoun: 'Pronoun',
  Prefix: 'Prefix',
  Particle: 'Particle',
  Suffix: 'Suffix',
  'る-Verb': verb('Ichidan'),
  'る-Verb (くれる)': verb('IchidanKureru'),
  'Verb (二段)': verb({ Nidan: undefined }),
  'Verb (四段)': verb({ Yodan: undefined }),
  'う-Verb': uVerb('U'),
  'う-Verb (ある)': uVerb('Aru'),
  'う-Verb (いく)': uVerb('IkuYuku'),
  'Verb (Intransitive)': verb('Intransitive'),
  'Irregular Verb (くる)': verb('Kuru'),
  'Irregular Verb (する)': irrVerb('Suru'),
  'Irregular Verb (〜する)': irrVerb('NounOrAuxSuru'),
  'Verb (Transitive)': verb('Transitive'),
  'る-Verb (ずる)': verb('IchidanZuru'),
} as const

type custumPos = keyof typeof customPosMap

export const commonPos: custumPos[] = [
  'い-Adjective',
  'な-Adjective',
  'Adverb',
  'Noun',
  'る-Verb',
  'う-Verb',
  'Irregular Verb (する)',
  'Irregular Verb (〜する)',
  'Verb (Intransitive)',
  'Verb (Transitive)',
]

export default (customPosMap satisfies Record<custumPos, JotobaPos>)