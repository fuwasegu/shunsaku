"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Smartphone, RotateCcw, TrendingUp, Award, Zap } from "lucide-react"

interface SwingData {
  maxAcceleration: number
  maxRotationRate: number
  swingDuration: number
  tempo: number
  smoothness: number
}

interface ClubRecommendation {
  id: number
  head: string
  shaft: string
  flex: string
  reason: string
  matchPercentage: number
  characteristics: string[]
}

export default function GolfSwingAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [swingData, setSwingData] = useState<SwingData | null>(null)
  const [recommendations, setRecommendations] = useState<ClubRecommendation[]>([])
  const [countdown, setCountdown] = useState(0)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  const motionDataRef = useRef<{
    accelerations: number[]
    rotationRates: number[]
    startTime: number
  }>({
    accelerations: [],
    rotationRates: [],
    startTime: 0,
  })

  useEffect(() => {
    // デバイスモーションの許可を確認
    if (typeof window !== "undefined" && "DeviceMotionEvent" in window) {
      if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
        setHasPermission(false)
      } else {
        setHasPermission(true)
      }
    } else {
      setHasPermission(false)
    }
  }, [])

  const requestPermission = async () => {
    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      const permission = await (DeviceMotionEvent as any).requestPermission()
      setHasPermission(permission === "granted")
    }
  }

  const analyzeSwingData = (data: typeof motionDataRef.current): SwingData => {
    const { accelerations, rotationRates, startTime } = data

    const maxAcceleration = Math.max(...accelerations)
    const maxRotationRate = Math.max(...rotationRates)
    const swingDuration = (Date.now() - startTime) / 1000

    // テンポ計算（加速度の変化率から）
    const tempo = accelerations.length > 0 ? accelerations.length / swingDuration : 0

    // スムーズネス計算（加速度の標準偏差から）
    const avgAcceleration = accelerations.reduce((a, b) => a + b, 0) / accelerations.length
    const variance =
      accelerations.reduce((sum, acc) => sum + Math.pow(acc - avgAcceleration, 2), 0) / accelerations.length
    const smoothness = Math.max(0, 100 - Math.sqrt(variance))

    return {
      maxAcceleration,
      maxRotationRate,
      swingDuration,
      tempo,
      smoothness,
    }
  }

  const generateRecommendations = (data: SwingData): ClubRecommendation[] => {
    const recommendations: ClubRecommendation[] = []

    // パワー重視の組み合わせ
    if (data.maxAcceleration > 15) {
      recommendations.push({
        id: 1,
        head: "TaylorMade Stealth 2",
        shaft: "Mitsubishi Tensei CK Pro Orange",
        flex: "S",
        reason: "高いヘッドスピードに対応した低スピン設計",
        matchPercentage: Math.min(95, 70 + data.maxAcceleration),
        characteristics: ["飛距離重視", "低スピン", "パワーヒッター向け"],
      })
    }

    // コントロール重視の組み合わせ
    if (data.smoothness > 60) {
      recommendations.push({
        id: 2,
        head: "Titleist TSR3",
        shaft: "Project X HZRDUS Smoke Blue",
        flex: data.maxAcceleration > 12 ? "S" : "R",
        reason: "安定したスイングに最適な操作性重視モデル",
        matchPercentage: Math.min(92, 60 + data.smoothness),
        characteristics: ["コントロール性", "中弾道", "操作性重視"],
      })
    }

    // バランス重視の組み合わせ
    recommendations.push({
      id: 3,
      head: "Callaway Paradym",
      shaft: "Fujikura Ventus Blue",
      flex: data.maxAcceleration > 14 ? "S" : "R",
      reason: "飛距離とコントロールのバランスが取れた万能モデル",
      matchPercentage: Math.min(88, 50 + (data.smoothness + data.maxAcceleration) / 2),
      characteristics: ["バランス型", "中高弾道", "オールラウンド"],
    })

    return recommendations.sort((a, b) => b.matchPercentage - a.matchPercentage).slice(0, 3)
  }

  const startAnalysis = async () => {
    if (!hasPermission) {
      await requestPermission()
      return
    }

    setIsAnalyzing(true)
    setCountdown(3)

    // カウントダウン
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          startSwingDetection()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const startSwingDetection = () => {
    motionDataRef.current = {
      accelerations: [],
      rotationRates: [],
      startTime: Date.now(),
    }

    const handleMotion = (event: DeviceMotionEvent) => {
      if (event.acceleration && event.rotationRate) {
        const totalAcceleration = Math.sqrt(
          Math.pow(event.acceleration.x || 0, 2) +
            Math.pow(event.acceleration.y || 0, 2) +
            Math.pow(event.acceleration.z || 0, 2),
        )

        const totalRotation = Math.sqrt(
          Math.pow(event.rotationRate.alpha || 0, 2) +
            Math.pow(event.rotationRate.beta || 0, 2) +
            Math.pow(event.rotationRate.gamma || 0, 2),
        )

        motionDataRef.current.accelerations.push(totalAcceleration)
        motionDataRef.current.rotationRates.push(totalRotation)
      }
    }

    window.addEventListener("devicemotion", handleMotion)

    // 5秒後に測定終了
    setTimeout(() => {
      window.removeEventListener("devicemotion", handleMotion)
      const analyzedData = analyzeSwingData(motionDataRef.current)
      const clubRecommendations = generateRecommendations(analyzedData)

      setSwingData(analyzedData)
      setRecommendations(clubRecommendations)
      setIsAnalyzing(false)
    }, 5000)
  }

  const resetAnalysis = () => {
    setSwingData(null)
    setRecommendations([])
    setCountdown(0)
  }

  if (hasPermission === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Smartphone className="w-12 h-12 mx-auto mb-4 text-green-600" />
            <CardTitle>センサーアクセス許可</CardTitle>
            <CardDescription>スイング解析にはデバイスのモーションセンサーへのアクセスが必要です</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={requestPermission} className="w-full">
              許可する
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ゴルフスイング解析</h1>
          <p className="text-gray-600">スマホを振ってスイングを解析し、最適なクラブを提案します</p>
        </div>

        {!swingData && !isAnalyzing && (
          <Card>
            <CardHeader className="text-center">
              <Smartphone className="w-16 h-16 mx-auto mb-4 text-green-600" />
              <CardTitle>スイング測定の準備</CardTitle>
              <CardDescription>スマホをしっかりと握り、ゴルフスイングの動作を行ってください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="font-semibold text-yellow-800 mb-2">注意事項</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• スマホを落とさないよう注意してください</li>
                  <li>• 周りに人や物がないことを確認してください</li>
                  <li>• 実際のスイングと同じ動作を行ってください</li>
                </ul>
              </div>
              <Button onClick={startAnalysis} className="w-full" size="lg">
                スイング解析を開始
              </Button>
            </CardContent>
          </Card>
        )}

        {isAnalyzing && (
          <Card>
            <CardContent className="text-center py-12">
              {countdown > 0 ? (
                <div>
                  <div className="text-6xl font-bold text-green-600 mb-4">{countdown}</div>
                  <p className="text-lg text-gray-600">準備してください...</p>
                </div>
              ) : (
                <div>
                  <div className="animate-pulse">
                    <RotateCcw className="w-16 h-16 mx-auto mb-4 text-green-600 animate-spin" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">スイング測定中...</p>
                  <p className="text-gray-600">スマホを振ってスイングしてください</p>
                  <Progress value={80} className="mt-4" />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {swingData && recommendations.length > 0 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  スイング解析結果
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{swingData.maxAcceleration.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">最大加速度 (m/s²)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{swingData.smoothness.toFixed(0)}</div>
                    <div className="text-sm text-gray-600">スムーズネス (%)</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{swingData.swingDuration.toFixed(1)}s</div>
                    <div className="text-sm text-gray-600">スイング時間</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{swingData.tempo.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">テンポ</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" />
                おすすめクラブ組み合わせ
              </h2>
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <Card key={rec.id} className={index === 0 ? "ring-2 ring-green-500" : ""}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {index === 0 && <Badge className="mr-2 bg-green-500">最適</Badge>}
                          組み合わせ {index + 1}
                        </CardTitle>
                        <div className="flex items-center gap-1">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <span className="font-bold text-green-600">{rec.matchPercentage}%</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="font-semibold text-gray-900">ヘッド: {rec.head}</div>
                        <div className="font-semibold text-gray-900">シャフト: {rec.shaft}</div>
                        <div className="text-sm text-gray-600">フレックス: {rec.flex}</div>
                      </div>
                      <p className="text-sm text-gray-700">{rec.reason}</p>
                      <div className="flex flex-wrap gap-1">
                        {rec.characteristics.map((char, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {char}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Button onClick={resetAnalysis} variant="outline" className="w-full bg-transparent">
              もう一度測定する
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
