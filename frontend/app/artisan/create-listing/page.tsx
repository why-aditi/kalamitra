"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { api } from "@/lib/api-client";
import {
  Mic,
  MicOff,
  Upload,
  X,
  ArrowLeft,
  ArrowRight,
  Heart,
  Sparkles,
  Check,
  Edit,
  Camera,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition"

export default function CreateListing() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isRecording, setIsRecording] = useState(false)
  const [transcription, setTranscription] = useState("")
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [aiListing, setAiListing] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [editMode, setEditMode] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
const {
  transcript,
  listening,
  resetTranscript,
  browserSupportsSpeechRecognition,
} = useSpeechRecognition();

const startRecording = () => {
  if (!browserSupportsSpeechRecognition) {
    alert("Browser does not support speech recognition.");
    return;
  }
  resetTranscript();
  SpeechRecognition.startListening({ continuous: true, language: "en-IN" });
  setIsRecording(true);
};

const stopRecording = () => {
  SpeechRecognition.stopListening();
  setIsRecording(false);
  setTranscription(transcript);
  console.log("Transcription:", transcript);
};


  // Image Upload Functions
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setImages((prev) => [...prev, ...files].slice(0, 5)) // Max 5 images
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"))
    setImages((prev) => [...prev, ...files].slice(0, 5))
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  // AI Generation
const generateListing = async () => {
  if (!transcription || images.length === 0) return;

  setIsGenerating(true);

  try {
    const formData = new FormData();
    formData.append("transcription", transcription);
    images.forEach((img, index) => formData.append(`images`, img));


    // Always get a fresh Firebase token from the current user
    let token = null;
    try {
      const { getAuth } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      const currentUser = getAuth().currentUser;
      if (currentUser) {
        token = await currentUser.getIdToken(true); // force refresh
      }
    } catch (e) {
      // fallback to localStorage if needed
      token = localStorage.getItem('accessToken');
    }
    if (!token) {
      alert("You must be signed in to create a listing.");
      setIsGenerating(false);
      return;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/create-listing`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error("Failed to generate listing");
    }

    const data = await response.json();
    setAiListing({
      ...data.ai_listing, // This contains the actual AI generated content
      listingId: data.listing_id, // Store the database ID
      imageIds: data.image_ids,
      createdAt: data.created_at
    });
    console.log("AI Listing Generated:", data);
  } catch (error) {
    console.error(error);
    alert("Error generating listing. Please try again.");
  } finally {
    setIsGenerating(false);
  }
};

// Update the publishListing function to handle already saved listing
const publishListing = async () => {
  try {
    // If we already have a listing ID, just redirect to dashboard
    if (aiListing?.listingId) {
      router.push(`/artisan/dashboard?success=true&listingId=${aiListing.listingId}`);
      return;
    }
    
    // Fallback: If for some reason we don't have a listing ID, create it now
    const formData = new FormData();
    formData.append("transcription", transcription);
    images.forEach((img, index) => formData.append(`images`, img));

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/create-listing`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to publish listing");
    }

    const data = await response.json();
    router.push(`/artisan/dashboard?success=true&listingId=${data.listing_id}`);
    
  } catch (error) {
    console.error(error);
    alert("Error publishing listing. Please try again.");
  }
};

  const steps = [
    { number: 1, title: "Voice Input", description: "Describe your product" },
    { number: 2, title: "Add Images", description: "Upload product photos" },
    { number: 3, title: "AI Generation", description: "Review AI-generated listing" },
    { number: 4, title: "Publish", description: "Go live on marketplace" },
  ]

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
 currentStep > step.number
 ? "bg-neem border-border text-primary-foreground"
 : currentStep === step.number
 ? "bg-madder border-madder text-primary-foreground"
 : "bg-card border-border text-muted-foreground"
 }`}
                >
                  {currentStep > step.number ? <Check className="w-5 h-5" /> : step.number}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 ${currentStep > step.number ? "bg-neem" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="font-medium text-foreground">{step.title}</div>
                <div className="text-muted-foreground">{step.description}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Step 1: Voice Input */}
          {currentStep === 1 && (
            <Card className="border-border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-madder">
                  <Mic className="w-5 h-5" />
                  Describe Your Product
                </CardTitle>
                <CardDescription>
                  Click the microphone and describe your product in your preferred language. Our AI will transcribe and
                  understand your description.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Recording Interface */}
                <div className="text-center">
                  <div
                    className={`w-32 h-32 rounded-full border-4 flex items-center justify-center mx-auto mb-4 transition-all ${
 isRecording
 ? "border-destructive bg-destructive/10 animate-pulse"
 : "border-border bg-secondary hover:bg-accent"
 }`}
                  >
                    <Button
                      size="lg"
                      variant="ghost"
                      className={`w-20 h-20 rounded-full ${
 isRecording
 ? "bg-destructive hover:bg-destructive text-primary-foreground"
 : "bg-madder hover:bg-madder/90 text-primary-foreground"
 }`}
                      onClick={isRecording ? stopRecording : startRecording}
                    >
                      {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                    </Button>
                  </div>
                  <p className="text-muted-foreground">
                    {isRecording ? "Recording... Click to stop" : "Click to start recording"}
                  </p>
                </div>

                {/* Transcription */}
                {(isTranscribing || transcription || isRecording) && (
                  <div className="space-y-4">
                    <Label>Transcription</Label>
                    {isRecording ? (
                      <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                        <RefreshCw className="w-4 h-4 animate-spin text-madder" />
                        <span className="text-muted-foreground">Listening... Speak now!</span>
                      </div>
                    ) : isTranscribing ? (
                      <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                        <RefreshCw className="w-4 h-4 animate-spin text-madder" />
                        <span className="text-muted-foreground">Transcribing your voice...</span>
                      </div>
                    ) : null}
                    <div className="space-y-2">
                      <Textarea
                        value={isRecording ? transcript : transcription}
                        onChange={(e) => setTranscription(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={startRecording}>
                          <Mic className="w-4 h-4 mr-1" />
                          Re-record
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {transcription && (
                  <div className="flex justify-end">
                    <Button
                      onClick={() => setCurrentStep(2)}
                      className="bg-madder"
                    >
                      Next: Add Images
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Image Upload */}
          {currentStep === 2 && (
            <Card className="border-border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-madder">
                  <Camera className="w-5 h-5" />
                  Add Product Images
                </CardTitle>
                <CardDescription>
                  Upload high-quality images of your product. You can add up to 5 images.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Upload Area */}
                <div
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-madder transition-colors cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-madder mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">
                    Drag and drop images here, or click to browse
                  </p>
                  <p className="text-sm text-muted-foreground">Supports JPG, PNG, WebP (Max 5 images)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                {/* Image Preview */}
                {images.length > 0 && (
                  <div className="space-y-4">
                    <Label>Uploaded Images ({images.length}/5)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          {/* A plain <img>: this is a blob: URL for a file the
                              user just picked, which next/image cannot optimise. */}
                          <img
                            src={URL.createObjectURL(image) || "/placeholder.svg"}
                            alt={`Product ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  {images.length > 0 && (
                    <Button
                      onClick={() => setCurrentStep(3)}
                      className="bg-madder"
                    >
                      Next: Generate Listing
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: AI Generation */}
          {currentStep === 3 && (
            <Card className="border-border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-madder">
                  <Sparkles className="w-5 h-5" />
                  AI-Generated Listing
                </CardTitle>
                <CardDescription>
                  Our AI will analyze your voice description and images to create a beautiful product listing and save it to the database.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!aiListing && !isGenerating && (
                  <div className="text-center py-8">
                    <Button
                      size="lg"
                      onClick={generateListing}
                      className="bg-madder"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate & Save Listing with AI
                    </Button>
                  </div>
                )}

                {isGenerating && (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-16 h-16 bg-madder rounded-full flex items-center justify-center mx-auto animate-pulse">
                      <Sparkles className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-muted-foreground mb-2">AI is creating your listing...</p>
                      <p className="text-sm text-muted-foreground">Analyzing description, processing images, and saving to database</p>
                    </div>
                    <Progress value={66} className="w-64 mx-auto" />
                  </div>
                )}

                {aiListing && (
                  <div className="space-y-6">
                    {/* Generated Listing Preview */}
                    <div className="bg-card border border-border rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Generated Listing</h3>
                        <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
                          <Edit className="w-4 h-4 mr-1" />
                          {editMode ? "Save" : "Edit"}
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label>Product Title</Label>
                          {editMode ? (
                            <Input
                              value={aiListing.title}
                              onChange={(e) => setAiListing({ ...aiListing, title: e.target.value })}
                            />
                          ) : (
                            <p className="text-foreground font-medium">{aiListing.title}</p>
                          )}
                        </div>

                        <div>
                          <Label>Description</Label>
                          {editMode ? (
                            <Textarea
                              value={aiListing.description}
                              onChange={(e) => setAiListing({ ...aiListing, description: e.target.value })}
                              rows={4}
                            />
                          ) : (
                            <p className="text-muted-foreground">{aiListing.description}</p>
                          )}
                        </div>

                        <div>
                          <Label>Tags</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {aiListing.tags?.map((tag: string, index: number) => (
                              <Badge key={index} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Category</Label>
                            <p className="text-foreground">{aiListing.category}</p>
                          </div>
                          <div>
                            <Label>Suggested Price</Label>
                            {editMode ? (
                              <Input
                                value={aiListing.suggestedPrice}
                                onChange={(e) => setAiListing({ ...aiListing, suggestedPrice: e.target.value })}
                              />
                            ) : (
                              <p className="text-foreground font-medium">{aiListing.suggestedPrice}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label>Artisan Story</Label>
                          <p className="text-muted-foreground italic">{aiListing.story}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setCurrentStep(2)}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                      <Button
                        onClick={() => setCurrentStep(4)}
                        className="bg-madder"
                      >
                        Preview & Publish
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 4: Publish */}
          {currentStep === 4 && aiListing && (
            <Card className="border-border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-madder">
                  <Check className="w-5 h-5" />
                  Ready to Publish
                </CardTitle>
                <CardDescription>
                  Review your listing one final time before publishing to the marketplace.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Final Preview */}
                <div className="rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    {images.length > 0 && (
                      <img
                        src={URL.createObjectURL(images[0]) || "/placeholder.svg"}
                        alt="Product"
                        className="w-24 h-24 object-cover rounded-lg border"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-2">{aiListing.title}</h3>
                      <p className="text-muted-foreground mb-3 line-clamp-2">{aiListing.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-madder">{aiListing.suggestedPrice}</span>
                        <Badge variant="outline">{aiListing.category}</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-accent border border-primary/30 rounded-lg p-4">
                  <h4 className="font-medium text-primary mb-2">What happens next?</h4>
                  <ul className="text-sm text-primary space-y-1">
                    <li>• Your product will be live on KalaMitra marketplace immediately</li>
                    <li>• Buyers can search and find your product</li>
                    <li>• You'll receive notifications for orders and inquiries</li>
                    <li>• You can manage your listings from your dashboard</li>
                  </ul>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(3)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Edit
                  </Button>
                  <Button
                    size="lg"
                    onClick={publishListing}
                    className="bg-primary"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Publish to Marketplace
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}