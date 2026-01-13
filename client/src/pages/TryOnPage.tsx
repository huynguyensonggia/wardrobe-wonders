import { useState, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockProducts } from '@/data/mockData';
import { 
  Upload, 
  Sparkles, 
  ImageIcon, 
  ArrowRight,
  RefreshCw,
  Download,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TryOnPage() {
  const [searchParams] = useSearchParams();
  const preselectedProduct = searchParams.get('product');
  
  const [selectedProduct, setSelectedProduct] = useState(preselectedProduct || '');
  const [userImage, setUserImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      setUserImage(event.target?.result as string);
      setResultImage(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleTryOn = async () => {
    if (!userImage || !selectedProduct) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // In real implementation, this would call the FITDiT API
      // For demo, we'll show the product image as the result
      const product = mockProducts.find(p => p.id === selectedProduct);
      if (product) {
        setResultImage(product.images[0].url);
      }
    } catch (err) {
      setError('Failed to generate try-on image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetTryOn = () => {
    setUserImage(null);
    setResultImage(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const availableProducts = mockProducts.filter(p => p.status === 'AVAILABLE');

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-gold" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-4">
            AI Virtual Try-On
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            See how any piece looks on you before renting. 
            Upload a full-body photo and select a garment to try on virtually.
          </p>
        </div>

        {/* Instructions */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: 1, title: 'Upload Photo', desc: 'Full-body photo with good lighting' },
              { step: 2, title: 'Select Item', desc: 'Choose a garment from our collection' },
              { step: 3, title: 'See Results', desc: 'AI generates your virtual try-on' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                  {item.step}
                </div>
                <h3 className="font-medium mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Your Photo</label>
                <div 
                  className={cn(
                    "relative aspect-[3/4] rounded-lg border-2 border-dashed transition-colors overflow-hidden",
                    userImage ? "border-accent" : "border-border hover:border-accent/50",
                    !userImage && "cursor-pointer"
                  )}
                  onClick={() => !userImage && fileInputRef.current?.click()}
                >
                  {userImage ? (
                    <>
                      <img 
                        src={userImage} 
                        alt="Your photo" 
                        className="w-full h-full object-cover"
                      />
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="absolute top-3 right-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          resetTryOn();
                        }}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Change
                      </Button>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                      <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                      <p className="font-medium mb-1">Upload your photo</p>
                      <p className="text-sm text-muted-foreground">
                        Full-body photo, front-facing, arms visible
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Photo Tips */}
              <div className="bg-secondary/50 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2">Tips for best results:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Stand in a well-lit area</li>
                  <li>• Wear form-fitting clothing</li>
                  <li>• Face the camera directly</li>
                  <li>• Ensure full body is visible</li>
                </ul>
              </div>
            </div>

            {/* Result Section */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Select Garment</label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a garment to try on" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Result Preview */}
              <div className="aspect-[3/4] rounded-lg bg-secondary overflow-hidden relative">
                {isProcessing ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
                      <Sparkles className="w-6 h-6 text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="mt-4 font-medium">Generating your try-on...</p>
                    <p className="text-sm text-muted-foreground">This may take a few seconds</p>
                  </div>
                ) : resultImage ? (
                  <>
                    <img 
                      src={resultImage} 
                      alt="Try-on result" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-3 right-3 flex gap-2">
                      <Button variant="secondary" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                    <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Your virtual try-on will appear here
                    </p>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Action Button */}
              <Button 
                variant="hero" 
                size="xl" 
                className="w-full"
                onClick={handleTryOn}
                disabled={!userImage || !selectedProduct || isProcessing}
              >
                {isProcessing ? (
                  'Processing...'
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Try-On
                  </>
                )}
              </Button>

              {/* Rent CTA */}
              {resultImage && selectedProduct && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-3">Love how it looks?</p>
                  <Button variant="gold" asChild>
                    <Link to={`/products/${selectedProduct}`}>
                      Rent This Piece
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
