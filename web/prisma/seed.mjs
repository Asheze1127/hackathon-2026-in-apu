import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const SAMPLE_PROFILES = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    displayName: "山田 直人",
    goal: "BtoB SaaSを伸ばす",
    currentOccupation: "SaaSスタートアップ共同創業者",
    age: 31,
    location: "東京都",
    createdAt: "2021-04-01T00:00:00.000Z",
    nodes: [
      {
        id: "11000000-0000-4000-8000-000000000001",
        concreteAnswer: "情報系の大学でプロダクトを作っていた",
        abstractAnswer: "自分の手で仕組みを作り、人の行動が変わる瞬間に強く惹かれていたから。",
        realTagNames: ["大学生", "エンジニア"],
        emotionalTagNames: ["好奇心", "向上心"],
        createdAt: "2021-04-01T00:00:00.000Z",
      },
      {
        id: "11000000-0000-4000-8000-000000000002",
        parentId: "11000000-0000-4000-8000-000000000001",
        concreteAnswer: "Webエンジニアとして就職した",
        abstractAnswer: "まずは現場でプロダクト開発の基礎を身につけて、実力をつけたかったから。",
        realTagNames: ["就職", "エンジニア"],
        emotionalTagNames: ["安定", "迷い"],
        createdAt: "2022-04-01T00:00:00.000Z",
      },
      {
        id: "11000000-0000-4000-8000-000000000003",
        parentId: "11000000-0000-4000-8000-000000000002",
        concreteAnswer: "スタートアップに転職して新規事業を担当した",
        abstractAnswer: "小さな組織で意思決定の速さを体感し、自分の裁量を広げたかったから。",
        realTagNames: ["転職", "スタートアップ", "エンジニア"],
        emotionalTagNames: ["挑戦", "向上心"],
        createdAt: "2023-06-01T00:00:00.000Z",
      },
      {
        id: "11000000-0000-4000-8000-000000000004",
        parentId: "11000000-0000-4000-8000-000000000003",
        concreteAnswer: "SaaSを共同創業した",
        abstractAnswer: "自分たちの意思決定で事業を前に進める責任を持ちたかったから。",
        realTagNames: ["起業", "経営", "スタートアップ"],
        emotionalTagNames: ["覚悟", "自由"],
        createdAt: "2024-08-01T00:00:00.000Z",
      },
      {
        id: "11000000-0000-4000-8000-000000000005",
        parentId: "11000000-0000-4000-8000-000000000004",
        concreteAnswer: "海外展開を進めている",
        abstractAnswer: "国内だけでなく、同じ課題を持つチームに価値を届けたいと考えたから。",
        realTagNames: ["経営", "海外勤務", "スタートアップ"],
        emotionalTagNames: ["希望", "責任感"],
        createdAt: "2025-09-01T00:00:00.000Z",
      },
    ],
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    displayName: "佐藤 あかり",
    goal: "プロダクトデザインで事業成長を支える",
    currentOccupation: "プロダクトデザイン責任者",
    age: 29,
    location: "大阪府",
    createdAt: "2021-04-01T00:00:00.000Z",
    nodes: [
      {
        id: "12000000-0000-4000-8000-000000000001",
        concreteAnswer: "大学で情報デザインを学んでいた",
        abstractAnswer: "使いやすさと見た目の両方で体験を変えることに魅力を感じていたから。",
        realTagNames: ["大学生", "デザイナー"],
        emotionalTagNames: ["好奇心", "向上心"],
        createdAt: "2021-04-01T00:00:00.000Z",
      },
      {
        id: "12000000-0000-4000-8000-000000000002",
        parentId: "12000000-0000-4000-8000-000000000001",
        concreteAnswer: "制作会社でUIデザイナーとして就職した",
        abstractAnswer: "まずは多様な案件でアウトプットの量を積みたかったから。",
        realTagNames: ["就職", "デザイナー"],
        emotionalTagNames: ["安定", "希望"],
        createdAt: "2022-04-01T00:00:00.000Z",
      },
      {
        id: "12000000-0000-4000-8000-000000000003",
        parentId: "12000000-0000-4000-8000-000000000002",
        concreteAnswer: "SaaSスタートアップに転職した",
        abstractAnswer: "単発案件ではなく、プロダクトの改善を長く追いかけたかったから。",
        realTagNames: ["転職", "スタートアップ", "デザイナー"],
        emotionalTagNames: ["挑戦", "迷い"],
        createdAt: "2023-05-01T00:00:00.000Z",
      },
      {
        id: "12000000-0000-4000-8000-000000000004",
        parentId: "12000000-0000-4000-8000-000000000003",
        concreteAnswer: "プロダクトデザイン責任者になった",
        abstractAnswer: "体験品質だけでなく、チーム全体の意思決定にも責任を持ちたくなったから。",
        realTagNames: ["経営", "スタートアップ", "デザイナー"],
        emotionalTagNames: ["責任感", "達成感"],
        createdAt: "2024-07-01T00:00:00.000Z",
      },
      {
        id: "12000000-0000-4000-8000-000000000005",
        parentId: "12000000-0000-4000-8000-000000000004",
        concreteAnswer: "デザイン顧問として複数社を支援している",
        abstractAnswer: "自分の視点をより多くのチームに届けながら、働き方の自由度も上げたかったから。",
        realTagNames: ["独立", "フリーランス", "デザイナー"],
        emotionalTagNames: ["自由", "誇り"],
        createdAt: "2025-10-01T00:00:00.000Z",
      },
    ],
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    displayName: "鈴木 健",
    goal: "場所に縛られずに開発で価値を出し続ける",
    currentOccupation: "フリーランスエンジニア",
    age: 34,
    location: "福岡県",
    createdAt: "2021-04-01T00:00:00.000Z",
    nodes: [
      {
        id: "13000000-0000-4000-8000-000000000001",
        concreteAnswer: "専門学校でアプリ開発を学んでいた",
        abstractAnswer: "早く現場に出られる実践的な環境で技術を磨きたかったから。",
        realTagNames: ["専門学校", "エンジニア"],
        emotionalTagNames: ["好奇心", "向上心"],
        createdAt: "2021-04-01T00:00:00.000Z",
      },
      {
        id: "13000000-0000-4000-8000-000000000002",
        parentId: "13000000-0000-4000-8000-000000000001",
        concreteAnswer: "受託開発会社に就職した",
        abstractAnswer: "まずは幅広い案件をこなしながら基礎体力をつけたかったから。",
        realTagNames: ["就職", "エンジニア"],
        emotionalTagNames: ["安定", "迷い"],
        createdAt: "2022-04-01T00:00:00.000Z",
      },
      {
        id: "13000000-0000-4000-8000-000000000003",
        parentId: "13000000-0000-4000-8000-000000000002",
        concreteAnswer: "副業で個人開発を始めた",
        abstractAnswer: "自分の名前で価値を届けられるか試してみたかったから。",
        realTagNames: ["副業", "エンジニア"],
        emotionalTagNames: ["挑戦", "希望"],
        createdAt: "2023-03-01T00:00:00.000Z",
      },
      {
        id: "13000000-0000-4000-8000-000000000004",
        parentId: "13000000-0000-4000-8000-000000000003",
        concreteAnswer: "フリーランスとして独立した",
        abstractAnswer: "案件選びから働く時間まで、自分で決められる状態を作りたかったから。",
        realTagNames: ["独立", "フリーランス", "エンジニア"],
        emotionalTagNames: ["自由", "覚悟"],
        createdAt: "2024-06-01T00:00:00.000Z",
      },
      {
        id: "13000000-0000-4000-8000-000000000005",
        parentId: "13000000-0000-4000-8000-000000000004",
        concreteAnswer: "海外チームの開発パートナーになった",
        abstractAnswer: "技術力で国境を越えて評価される状態を作りたかったから。",
        realTagNames: ["海外勤務", "フリーランス", "エンジニア"],
        emotionalTagNames: ["自信", "充実感"],
        createdAt: "2025-08-01T00:00:00.000Z",
      },
    ],
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    displayName: "高橋 玲奈",
    goal: "研究と事業の間をつなぐAIプロダクトを作る",
    currentOccupation: "AIプロダクト技術責任者",
    age: 32,
    location: "神奈川県",
    createdAt: "2021-04-01T00:00:00.000Z",
    nodes: [
      {
        id: "14000000-0000-4000-8000-000000000001",
        concreteAnswer: "大学院で機械学習を研究していた",
        abstractAnswer: "理論だけでなく、社会実装まで考えられる研究に没頭したかったから。",
        realTagNames: ["大学院生", "研究", "エンジニア"],
        emotionalTagNames: ["好奇心", "向上心"],
        createdAt: "2021-04-01T00:00:00.000Z",
      },
      {
        id: "14000000-0000-4000-8000-000000000002",
        parentId: "14000000-0000-4000-8000-000000000001",
        concreteAnswer: "研究職として就職した",
        abstractAnswer: "研究を続けながら社会実装の距離感を学べる環境を選びたかったから。",
        realTagNames: ["研究", "就職", "エンジニア"],
        emotionalTagNames: ["希望", "緊張"],
        createdAt: "2022-04-01T00:00:00.000Z",
      },
      {
        id: "14000000-0000-4000-8000-000000000003",
        parentId: "14000000-0000-4000-8000-000000000002",
        concreteAnswer: "外資のAIチームへ転職した",
        abstractAnswer: "研究の深さと事業スピードの両方を高い基準で求める環境に身を置きたかったから。",
        realTagNames: ["転職", "外資", "研究", "エンジニア"],
        emotionalTagNames: ["挑戦", "自信"],
        createdAt: "2023-07-01T00:00:00.000Z",
      },
      {
        id: "14000000-0000-4000-8000-000000000004",
        parentId: "14000000-0000-4000-8000-000000000003",
        concreteAnswer: "AIプロダクトの技術責任者を担っている",
        abstractAnswer: "研究成果をチームの成果に変える役割に挑戦したかったから。",
        realTagNames: ["経営", "外資", "エンジニア"],
        emotionalTagNames: ["責任感", "達成感"],
        createdAt: "2024-09-01T00:00:00.000Z",
      },
      {
        id: "14000000-0000-4000-8000-000000000005",
        parentId: "14000000-0000-4000-8000-000000000004",
        concreteAnswer: "研究成果をもとに新規事業を構想している",
        abstractAnswer: "技術の面白さを、もっと直接的な価値として届ける挑戦をしたいから。",
        realTagNames: ["起業", "研究", "スタートアップ"],
        emotionalTagNames: ["希望", "覚悟"],
        createdAt: "2025-11-01T00:00:00.000Z",
      },
    ],
  },
  {
    id: "10000000-0000-4000-8000-000000000005",
    displayName: "伊藤 翼",
    goal: "地域課題を解く事業を大きくする",
    currentOccupation: "GovTechスタートアップ事業開発",
    age: 30,
    location: "京都府",
    createdAt: "2021-04-01T00:00:00.000Z",
    nodes: [
      {
        id: "15000000-0000-4000-8000-000000000001",
        concreteAnswer: "大学で公共政策を学んでいた",
        abstractAnswer: "制度や地域課題を構造で理解したいと思っていたから。",
        realTagNames: ["大学生", "公務員"],
        emotionalTagNames: ["安定", "好奇心"],
        createdAt: "2021-04-01T00:00:00.000Z",
      },
      {
        id: "15000000-0000-4000-8000-000000000002",
        parentId: "15000000-0000-4000-8000-000000000001",
        concreteAnswer: "自治体職員として就職した",
        abstractAnswer: "まずは現場の課題を自分の目で見て理解したかったから。",
        realTagNames: ["就職", "公務員"],
        emotionalTagNames: ["安定", "責任感"],
        createdAt: "2022-04-01T00:00:00.000Z",
      },
      {
        id: "15000000-0000-4000-8000-000000000003",
        parentId: "15000000-0000-4000-8000-000000000002",
        concreteAnswer: "副業で地域スタートアップを支援した",
        abstractAnswer: "行政だけでは届きにくい解決策を民間と一緒に試したかったから。",
        realTagNames: ["副業", "スタートアップ", "公務員"],
        emotionalTagNames: ["挑戦", "葛藤"],
        createdAt: "2023-06-01T00:00:00.000Z",
      },
      {
        id: "15000000-0000-4000-8000-000000000004",
        parentId: "15000000-0000-4000-8000-000000000003",
        concreteAnswer: "GovTechスタートアップに転職した",
        abstractAnswer: "意思決定の速さを持つ組織で、地域に届く仕組みを作りたくなったから。",
        realTagNames: ["転職", "スタートアップ", "経営"],
        emotionalTagNames: ["挑戦", "希望"],
        createdAt: "2024-08-01T00:00:00.000Z",
      },
      {
        id: "15000000-0000-4000-8000-000000000005",
        parentId: "15000000-0000-4000-8000-000000000004",
        concreteAnswer: "事業開発をリードしている",
        abstractAnswer: "現場の解像度を持ったまま、仕組みとして広げる立場を担いたかったから。",
        realTagNames: ["経営", "スタートアップ"],
        emotionalTagNames: ["責任感", "充実感"],
        createdAt: "2025-09-01T00:00:00.000Z",
      },
    ],
  },
  {
    id: "10000000-0000-4000-8000-000000000006",
    displayName: "小林 美咲",
    goal: "医療現場の課題をプロダクトで減らす",
    currentOccupation: "ヘルステックプロダクトオーナー",
    age: 28,
    location: "愛知県",
    createdAt: "2021-04-01T00:00:00.000Z",
    nodes: [
      {
        id: "16000000-0000-4000-8000-000000000001",
        concreteAnswer: "看護学科で実習を重ねていた",
        abstractAnswer: "人の不安に近い距離で向き合える仕事を選びたかったから。",
        realTagNames: ["大学生", "看護師"],
        emotionalTagNames: ["責任感", "緊張"],
        createdAt: "2021-04-01T00:00:00.000Z",
      },
      {
        id: "16000000-0000-4000-8000-000000000002",
        parentId: "16000000-0000-4000-8000-000000000001",
        concreteAnswer: "看護師として就職した",
        abstractAnswer: "まずは現場のリアルな課題を体で理解したかったから。",
        realTagNames: ["就職", "看護師"],
        emotionalTagNames: ["安心", "責任感"],
        createdAt: "2022-04-01T00:00:00.000Z",
      },
      {
        id: "16000000-0000-4000-8000-000000000003",
        parentId: "16000000-0000-4000-8000-000000000002",
        concreteAnswer: "医療DXに関心を持って資格取得を進めた",
        abstractAnswer: "忙しい現場の負担を減らす仕組みを、自分でも作れるようになりたかったから。",
        realTagNames: ["資格取得", "看護師"],
        emotionalTagNames: ["向上心", "希望"],
        createdAt: "2023-05-01T00:00:00.000Z",
      },
      {
        id: "16000000-0000-4000-8000-000000000004",
        parentId: "16000000-0000-4000-8000-000000000003",
        concreteAnswer: "ヘルステックのスタートアップに転職した",
        abstractAnswer: "現場で見えていた課題に、プロダクト側から向き合いたくなったから。",
        realTagNames: ["転職", "スタートアップ"],
        emotionalTagNames: ["挑戦", "迷い"],
        createdAt: "2024-07-01T00:00:00.000Z",
      },
      {
        id: "16000000-0000-4000-8000-000000000005",
        parentId: "16000000-0000-4000-8000-000000000004",
        concreteAnswer: "プロダクト改善を担っている",
        abstractAnswer: "医療現場の解像度を持ったまま、継続的な改善を回せる立場に進みたかったから。",
        realTagNames: ["スタートアップ", "経営"],
        emotionalTagNames: ["達成感", "充実感"],
        createdAt: "2025-10-01T00:00:00.000Z",
      },
    ],
  },
  {
    id: "10000000-0000-4000-8000-000000000007",
    displayName: "中村 蓮",
    goal: "教育格差を減らす事業を作る",
    currentOccupation: "EdTechスタートアップ代表",
    age: 33,
    location: "北海道",
    createdAt: "2021-04-01T00:00:00.000Z",
    nodes: [
      {
        id: "17000000-0000-4000-8000-000000000001",
        concreteAnswer: "教育学部で学びながら学習支援をしていた",
        abstractAnswer: "一人ひとりに合った学び方を支えられる人になりたかったから。",
        realTagNames: ["大学生", "教師"],
        emotionalTagNames: ["共感", "向上心"],
        createdAt: "2021-04-01T00:00:00.000Z",
      },
      {
        id: "17000000-0000-4000-8000-000000000002",
        parentId: "17000000-0000-4000-8000-000000000001",
        concreteAnswer: "高校教師として就職した",
        abstractAnswer: "まずは教室で生徒と向き合い、現場の課題を自分で掴みたかったから。",
        realTagNames: ["就職", "教師"],
        emotionalTagNames: ["責任感", "安定"],
        createdAt: "2022-04-01T00:00:00.000Z",
      },
      {
        id: "17000000-0000-4000-8000-000000000003",
        parentId: "17000000-0000-4000-8000-000000000002",
        concreteAnswer: "副業でオンライン教材を作り始めた",
        abstractAnswer: "授業の外でも継続して学べる仕組みを自分で試したかったから。",
        realTagNames: ["副業", "教師", "デザイナー"],
        emotionalTagNames: ["好奇心", "挑戦"],
        createdAt: "2023-05-01T00:00:00.000Z",
      },
      {
        id: "17000000-0000-4000-8000-000000000004",
        parentId: "17000000-0000-4000-8000-000000000003",
        concreteAnswer: "EdTechスタートアップを起業した",
        abstractAnswer: "教室の中だけでは届かない学習機会を、仕組みとして広げたかったから。",
        realTagNames: ["起業", "スタートアップ", "経営"],
        emotionalTagNames: ["覚悟", "希望"],
        createdAt: "2024-08-01T00:00:00.000Z",
      },
      {
        id: "17000000-0000-4000-8000-000000000005",
        parentId: "17000000-0000-4000-8000-000000000004",
        concreteAnswer: "全国の学校向けに事業を広げている",
        abstractAnswer: "一つの学校で終わらせず、より多くの学習環境に届けたかったから。",
        realTagNames: ["スタートアップ", "経営"],
        emotionalTagNames: ["達成感", "責任感"],
        createdAt: "2025-11-01T00:00:00.000Z",
      },
    ],
  },
]

function collectRequiredTagNames() {
  return [
    ...new Set(
      SAMPLE_PROFILES.flatMap((profile) =>
        profile.nodes.flatMap((node) => [
          ...node.realTagNames,
          ...node.emotionalTagNames,
        ])
      )
    ),
  ]
}

function buildTagIdMap(tagRows) {
  return new Map(tagRows.map((tag) => [tag.name.trim(), tag.id]))
}

async function upsertProfilesAndNodes(tagIdByName) {
  for (const profile of SAMPLE_PROFILES) {
    await prisma.profile.upsert({
      where: { id: profile.id },
      create: {
        id: profile.id,
        displayName: profile.displayName,
        goal: profile.goal,
        currentOccupation: profile.currentOccupation,
        age: profile.age,
        location: profile.location,
        onboarded: true,
        createdAt: new Date(profile.createdAt),
      },
      update: {
        displayName: profile.displayName,
        goal: profile.goal,
        currentOccupation: profile.currentOccupation,
        age: profile.age,
        location: profile.location,
        onboarded: true,
        createdAt: new Date(profile.createdAt),
      },
    })

    for (const node of profile.nodes) {
      await prisma.node.upsert({
        where: { id: node.id },
        create: {
          id: node.id,
          userId: profile.id,
          parentId: node.parentId ?? null,
          concreteAnswer: node.concreteAnswer,
          abstractAnswer: node.abstractAnswer,
          realTags: node.realTagNames.map((tagName) => tagIdByName.get(tagName)),
          emotionalTags: node.emotionalTagNames.map((tagName) =>
            tagIdByName.get(tagName)
          ),
          createdAt: new Date(node.createdAt),
        },
        update: {
          userId: profile.id,
          parentId: node.parentId ?? null,
          concreteAnswer: node.concreteAnswer,
          abstractAnswer: node.abstractAnswer,
          realTags: node.realTagNames.map((tagName) => tagIdByName.get(tagName)),
          emotionalTags: node.emotionalTagNames.map((tagName) =>
            tagIdByName.get(tagName)
          ),
          createdAt: new Date(node.createdAt),
        },
      })
    }
  }
}

async function main() {
  const requiredTagNames = collectRequiredTagNames()
  const tagRows = await prisma.tag.findMany({
    where: {
      name: {
        in: requiredTagNames,
      },
    },
    select: {
      id: true,
      name: true,
    },
  })

  const tagIdByName = buildTagIdMap(tagRows)
  const missingTagNames = requiredTagNames.filter(
    (tagName) => !tagIdByName.has(tagName)
  )

  if (missingTagNames.length > 0) {
    throw new Error(
      `Missing tags required for seed data: ${missingTagNames.join(", ")}`
    )
  }

  await upsertProfilesAndNodes(tagIdByName)

  console.info(
    `Seeded ${SAMPLE_PROFILES.length} sample profiles and ${SAMPLE_PROFILES.reduce(
      (sum, profile) => sum + profile.nodes.length,
      0
    )} nodes.`
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
