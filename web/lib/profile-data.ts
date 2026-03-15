import type { LucideIcon } from "lucide-react"
import {
  Star,
  RefreshCcw,
  GraduationCap,
  Flag,
  MapPin,
  Calendar,
  Plane,
  Rocket,
} from "lucide-react"

export type TimelineItem = {
  Icon: LucideIcon
  dotClass: string
  dotIconColor: string
  date: string
  dateClass: string
  DateIcon: LucideIcon
  title: string
  body: string
  choice: string | null
  choiceClass: string
  choiceDotClass: string
  choiceTextClass: string
  cardClass: string
  hasLine: boolean
}

export type Message = {
  role: "ai" | "user" | "typing"
  text?: string
  time?: string
}

export type RoleModel = {
  name: string
  avatarText: string
  role: string
  age: string
  location: string
  years: string
  branchFrom: string
  branchTo: string
  timelineItems: TimelineItem[]
  profileNodes: {
    id: string
    type: string
    position: { x: number; y: number }
    data: { label: string }
  }[]
  profileEdges: { id: string; source: string; target: string }[]
  initialMessages: Message[]
}

export const ROLE_MODELS: Record<string, RoleModel> = {
  tanaka: {
    name: "田中 誠",
    avatarText: "田",
    role: "フリーランスエンジニア",
    age: "35歳",
    location: "東京都",
    years: "経歴12年",
    branchFrom: "大学進学 → NO",
    branchTo: "専門学校でプログラミングを習得",
    timelineItems: [
      {
        Icon: Star,
        dotClass: "bg-amber-50 border-2 border-amber-300",
        dotIconColor: "#d97706",
        date: "現在",
        dateClass: "bg-amber-50 text-amber-600",
        DateIcon: MapPin,
        title: "現在地",
        body: "国内外20社以上のクライアントと契約。年収900万円を超え、リモートワーク中心の理想のライフスタイルを実現。",
        choice: null,
        choiceClass: "",
        choiceDotClass: "",
        choiceTextClass: "",
        cardClass: "bg-amber-50 border border-amber-200 ring-0",
        hasLine: true,
      },
      {
        Icon: RefreshCcw,
        dotClass: "bg-primary",
        dotIconColor: "white",
        date: "2016年 9月",
        dateClass: "bg-indigo-50 text-indigo-500",
        DateIcon: Calendar,
        title: "フリーランスとして独立",
        body: "7年の会社員経験を経て独立。リスクと自由を天秤にかけ、貯金半年分を確保してから決断。",
        choice: "フリーランス独立 を選択",
        choiceClass: "bg-green-50",
        choiceDotClass: "bg-green-600",
        choiceTextClass: "text-green-700",
        cardClass: "bg-white",
        hasLine: true,
      },
      {
        Icon: GraduationCap,
        dotClass: "bg-primary",
        dotIconColor: "white",
        date: "2009年 3月",
        dateClass: "bg-indigo-50 text-indigo-500",
        DateIcon: Calendar,
        title: "専門学校卒業・就職",
        body: "ITベンチャーからの内定を得る。大手企業の安定と悩んだが、成長環境を優先してベンチャーへ。",
        choice: "ITベンチャーに就職 を選択",
        choiceClass: "bg-indigo-50",
        choiceDotClass: "bg-indigo-500",
        choiceTextClass: "text-indigo-600",
        cardClass: "bg-white",
        hasLine: true,
      },
      {
        Icon: Flag,
        dotClass: "bg-slate-800",
        dotIconColor: "white",
        date: "2007年 3月",
        dateClass: "bg-indigo-50 text-indigo-500",
        DateIcon: Calendar,
        title: "高校卒業",
        body: "大学進学の選択肢があったが、プログラミングへの興味が強く専門学校への進学を選択。",
        choice: "専門学校進学 を選択",
        choiceClass: "bg-indigo-50",
        choiceDotClass: "bg-indigo-500",
        choiceTextClass: "text-indigo-600",
        cardClass: "bg-white",
        hasLine: false,
      },
    ],
    profileNodes: [
      {
        id: "n1",
        type: "circle",
        position: { x: 0, y: 0 },
        data: { label: "現在" },
      },
      {
        id: "n2",
        type: "circle",
        position: { x: 0, y: -120 },
        data: { label: "独立\n2016" },
      },
      {
        id: "n3",
        type: "circle",
        position: { x: 0, y: -240 },
        data: { label: "就職\n2009" },
      },
      {
        id: "n4",
        type: "circle",
        position: { x: 0, y: -360 },
        data: { label: "高校卒業\n2007" },
      },
    ],
    profileEdges: [
      { id: "n1-n2", source: "n1", target: "n2" },
      { id: "n2-n3", source: "n2", target: "n3" },
      { id: "n3-n4", source: "n3", target: "n4" },
    ],
    initialMessages: [
      {
        role: "ai",
        text: "はじめまして！田中誠です。専門学校卒業からフリーランスまでの経緯について、何でも聞いてください。",
        time: "10:23",
      },
      {
        role: "user",
        text: "大学に行かなかったことで、就活で苦労しませんでしたか？",
        time: "10:25",
      },
      {
        role: "ai",
        text: "正直、最初の就職活動は苦戦しました。でも「即戦力のスキル」をポートフォリオで示すことで、ベンチャー企業からの内定を得られました。学歴より実力を見てくれる会社を選んだのが正解でしたね。",
        time: "10:26",
      },
      {
        role: "user",
        text: "フリーランスになる踏ん切りはどうつけましたか？",
        time: "10:28",
      },
      { role: "typing" },
    ],
  },

  sato: {
    name: "佐藤 あかり",
    avatarText: "佐",
    role: "プロダクトデザイナー",
    age: "29歳",
    location: "大阪府",
    years: "経歴7年",
    branchFrom: "海外留学 → YES",
    branchTo: "フィンランドでデザインを学ぶ",
    timelineItems: [
      {
        Icon: Star,
        dotClass: "bg-amber-50 border-2 border-amber-300",
        dotIconColor: "#d97706",
        date: "現在",
        dateClass: "bg-amber-50 text-amber-600",
        DateIcon: MapPin,
        title: "現在地",
        body: "グローバルなSaaSスタートアップのリードデザイナーとして活躍。ユーザーリサーチからUI設計まで一貫して担当。",
        choice: null,
        choiceClass: "",
        choiceDotClass: "",
        choiceTextClass: "",
        cardClass: "bg-amber-50 border border-amber-200 ring-0",
        hasLine: true,
      },
      {
        Icon: RefreshCcw,
        dotClass: "bg-primary",
        dotIconColor: "white",
        date: "2020年 4月",
        dateClass: "bg-indigo-50 text-indigo-500",
        DateIcon: Calendar,
        title: "スタートアップに転職",
        body: "大手代理店での3年間を経て、よりプロダクトに近い環境へ。海外経験が英語でのコミュニケーションに活きている。",
        choice: "スタートアップへ転職 を選択",
        choiceClass: "bg-green-50",
        choiceDotClass: "bg-green-600",
        choiceTextClass: "text-green-700",
        cardClass: "bg-white",
        hasLine: true,
      },
      {
        Icon: Plane,
        dotClass: "bg-primary",
        dotIconColor: "white",
        date: "2017年 9月",
        dateClass: "bg-indigo-50 text-indigo-500",
        DateIcon: Calendar,
        title: "フィンランド留学・帰国・就職",
        body: "Aalto大学でサービスデザインを1年間学ぶ。帰国後、国内デザイン会社からオファーを得て入社。",
        choice: "海外留学 を選択",
        choiceClass: "bg-indigo-50",
        choiceDotClass: "bg-indigo-500",
        choiceTextClass: "text-indigo-600",
        cardClass: "bg-white",
        hasLine: true,
      },
      {
        Icon: Flag,
        dotClass: "bg-slate-800",
        dotIconColor: "white",
        date: "2017年 3月",
        dateClass: "bg-indigo-50 text-indigo-500",
        DateIcon: Calendar,
        title: "大学卒業",
        body: "美術大学でビジュアルデザインを専攻。卒業後すぐ就職する同期が多い中、留学という道を選んだ。",
        choice: "フィンランド留学 を選択",
        choiceClass: "bg-indigo-50",
        choiceDotClass: "bg-indigo-500",
        choiceTextClass: "text-indigo-600",
        cardClass: "bg-white",
        hasLine: false,
      },
    ],
    profileNodes: [
      {
        id: "n1",
        type: "circle",
        position: { x: 0, y: 0 },
        data: { label: "現在" },
      },
      {
        id: "n2",
        type: "circle",
        position: { x: 0, y: -120 },
        data: { label: "転職\n2020" },
      },
      {
        id: "n3",
        type: "circle",
        position: { x: 0, y: -240 },
        data: { label: "留学・就職\n2017" },
      },
      {
        id: "n4",
        type: "circle",
        position: { x: 0, y: -360 },
        data: { label: "大学卒業\n2017" },
      },
    ],
    profileEdges: [
      { id: "n1-n2", source: "n1", target: "n2" },
      { id: "n2-n3", source: "n2", target: "n3" },
      { id: "n3-n4", source: "n3", target: "n4" },
    ],
    initialMessages: [
      {
        role: "ai",
        text: "はじめまして！佐藤あかりです。留学やデザインキャリアについて何でも聞いてください。",
        time: "10:23",
      },
      { role: "user", text: "留学を決めた理由は何ですか？", time: "10:25" },
      {
        role: "ai",
        text: "日本のデザイン教育に物足りなさを感じていて、北欧のサービスデザインの考え方に惹かれていました。就職を1年遅らせるリスクより、世界レベルの視野を得ることの方が大事だと思いました。",
        time: "10:26",
      },
      { role: "user", text: "留学中に一番大変だったことは？", time: "10:28" },
      { role: "typing" },
    ],
  },

  suzuki: {
    name: "鈴木 健太",
    avatarText: "鈴",
    role: "スタートアップ CEO",
    age: "32歳",
    location: "福岡県",
    years: "経歴10年",
    branchFrom: "就職 → NO",
    branchTo: "大学在学中に起業",
    timelineItems: [
      {
        Icon: Star,
        dotClass: "bg-amber-50 border-2 border-amber-300",
        dotIconColor: "#d97706",
        date: "現在",
        dateClass: "bg-amber-50 text-amber-600",
        DateIcon: MapPin,
        title: "現在地",
        body: "HRテック系スタートアップのCEOとして累計5億円を調達。チーム30名で国内外への展開を推進中。",
        choice: null,
        choiceClass: "",
        choiceDotClass: "",
        choiceTextClass: "",
        cardClass: "bg-amber-50 border border-amber-200 ring-0",
        hasLine: true,
      },
      {
        Icon: Rocket,
        dotClass: "bg-primary",
        dotIconColor: "white",
        date: "2019年 6月",
        dateClass: "bg-indigo-50 text-indigo-500",
        DateIcon: Calendar,
        title: "シリーズA調達・本格拡大",
        body: "3億円の調達に成功。採用・組織づくりに奔走し、プロダクトのグロースを加速させた。",
        choice: "資金調達・拡大路線 を選択",
        choiceClass: "bg-green-50",
        choiceDotClass: "bg-green-600",
        choiceTextClass: "text-green-700",
        cardClass: "bg-white",
        hasLine: true,
      },
      {
        Icon: RefreshCcw,
        dotClass: "bg-primary",
        dotIconColor: "white",
        date: "2016年 4月",
        dateClass: "bg-indigo-50 text-indigo-500",
        DateIcon: Calendar,
        title: "大学卒業・法人化",
        body: "内定を辞退し会社を正式設立。友人2名と共同創業し、HR領域のプロダクト開発を開始。",
        choice: "内定辞退・起業 を選択",
        choiceClass: "bg-indigo-50",
        choiceDotClass: "bg-indigo-500",
        choiceTextClass: "text-indigo-600",
        cardClass: "bg-white",
        hasLine: true,
      },
      {
        Icon: Flag,
        dotClass: "bg-slate-800",
        dotIconColor: "white",
        date: "2014年 10月",
        dateClass: "bg-indigo-50 text-indigo-500",
        DateIcon: Calendar,
        title: "在学中に起業準備",
        body: "大学3年時に就活をやめ、起業家コミュニティへ参加。複数の内定を持ちながらも事業化を決意。",
        choice: "就活離脱・起業準備 を選択",
        choiceClass: "bg-indigo-50",
        choiceDotClass: "bg-indigo-500",
        choiceTextClass: "text-indigo-600",
        cardClass: "bg-white",
        hasLine: false,
      },
    ],
    profileNodes: [
      {
        id: "n1",
        type: "circle",
        position: { x: 0, y: 0 },
        data: { label: "現在" },
      },
      {
        id: "n2",
        type: "circle",
        position: { x: 0, y: -120 },
        data: { label: "調達\n2019" },
      },
      {
        id: "n3",
        type: "circle",
        position: { x: 0, y: -240 },
        data: { label: "法人化\n2016" },
      },
      {
        id: "n4",
        type: "circle",
        position: { x: 0, y: -360 },
        data: { label: "起業準備\n2014" },
      },
    ],
    profileEdges: [
      { id: "n1-n2", source: "n1", target: "n2" },
      { id: "n2-n3", source: "n2", target: "n3" },
      { id: "n3-n4", source: "n3", target: "n4" },
    ],
    initialMessages: [
      {
        role: "ai",
        text: "はじめまして！鈴木健太です。起業の経緯や経営の話、何でも聞いてください。",
        time: "10:23",
      },
      {
        role: "user",
        text: "内定を辞退するのは怖くなかったですか？",
        time: "10:25",
      },
      {
        role: "ai",
        text: "正直めちゃくちゃ怖かったです（笑）。でも「失敗しても20代のうちにやり直せる」と自分に言い聞かせました。最悪就職すれば良いという逃げ道が、逆に背中を押してくれましたね。",
        time: "10:26",
      },
      { role: "user", text: "最初の資金はどう工面しましたか？", time: "10:28" },
      { role: "typing" },
    ],
  },
}
