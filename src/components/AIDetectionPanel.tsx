import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Eye, AlertCircle, CheckCircle } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface Detection {
  label: string;
  confidence: number;
  status: "healthy" | "disease";
  bbox: { x: number; y: number; width: number; height: number };
}

interface AIDetectionPanelProps {
  imageUrl: string;
  detections: Detection[];
}

export function AIDetectionPanel({
  imageUrl,
  detections,
}: AIDetectionPanelProps) {
  return (
    <div className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center space-x-2 mb-4">
        <Eye className="w-5 h-5 text-green-600" />
        <h3 className="text-lg text-gray-900 font-medium">AI Plant Health Detection</h3>
      </div>

      <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4">
        <ImageWithFallback
          src={imageUrl}
          alt="Plant monitoring camera"
          className="w-full h-64 object-cover"
        />

        {detections.map((detection, index) => (
          <div
            key={index}
            className="absolute border-2 border-green-500"
            style={{
              left: `${detection.bbox.x}%`,
              top: `${detection.bbox.y}%`,
              width: `${detection.bbox.width}%`,
              height: `${detection.bbox.height}%`,
            }}
          >
            <div className="absolute -top-6 left-0 bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {detection.label} ({detection.confidence}%)
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {detections.map((detection, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-white/50 backdrop-blur-md rounded-lg border border-white/20"
          >
            <div className="flex items-center space-x-3">
              {detection.status === "healthy" ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className="text-gray-900">{detection.label}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {detection.confidence}%
              </span>
              <Badge
                className={
                  detection.status === "healthy"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }
              >
                {detection.status === "healthy" ? "Healthy" : "Disease"}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}