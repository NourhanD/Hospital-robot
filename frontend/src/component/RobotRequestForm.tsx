import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { MapPin, ZoomIn, ZoomOut } from 'lucide-react';

interface RobotRequestFormProps {
  onRequest: (coordinates: {
    x: number;
    y: number;
    floor: number;
    yaw: number;
    room?: string;
  }) => void;
  disabled: boolean;
  currentLocation?: {
    x: number;
    y: number;
    floor: number;
    yaw: number;
    room: string;
  };
}

export const RobotRequestForm = ({ onRequest, disabled, currentLocation }: RobotRequestFormProps) => {
  const [coordinates, setCoordinates] = useState({
    x: 0,
    y: 0,
    floor: 1,
    yaw: 0,
    room: '',
  });
  const [selectedMapPosition, setSelectedMapPosition] = useState<{x: number, y: number} | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number[]>([100]);
  const { toast } = useToast();

  // Update map position when currentLocation changes (robot moves)
  useEffect(() => {
    if (currentLocation) {
      setSelectedMapPosition({ x: currentLocation.x, y: currentLocation.y });
      setCoordinates({
        x: currentLocation.x,
        y: currentLocation.y,
        floor: currentLocation.floor,
        yaw: currentLocation.yaw,
        room: currentLocation.room,
      });
    }
  }, [currentLocation]);

  const rooms = [
    { value: 'emergency', label: 'Emergency Room' },
    { value: 'surgery', label: 'Surgery Room 1' },
    { value: 'surgery2', label: 'Surgery Room 2' },
    { value: 'icu', label: 'ICU Ward' },
    { value: 'general1', label: 'General Ward A' },
    { value: 'general2', label: 'General Ward B' },
    { value: 'pediatric', label: 'Pediatric Ward' },
    { value: 'maternity', label: 'Maternity Ward' },
    { value: 'pharmacy', label: 'Pharmacy' },
    { value: 'lab', label: 'Laboratory' },
    { value: 'radiology', label: 'Radiology' },
    { value: 'reception', label: 'Reception' },
    { value: 'cafeteria', label: 'Cafeteria' },
    { value: 'storage', label: 'Storage Room' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (disabled) {
      toast({
        title: "Robot Busy",
        description: "Please wait for the current task to complete.",
        variant: "destructive",
      });
      return;
    }

    // Update map position when sending coordinates
    setSelectedMapPosition({ x: coordinates.x, y: coordinates.y });

    onRequest({
      x: coordinates.x,
      y: coordinates.y,
      floor: coordinates.floor,
      yaw: coordinates.yaw,
      room: coordinates.room,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setCoordinates(prev => ({
      ...prev,
      [field]: numValue
    }));
    
     if (field === 'x' || field === 'y') {
      setSelectedMapPosition((prev) => ({
        x: field === 'x' ? numValue : prev?.x ?? 0,
        y: field === 'y' ? numValue : prev?.y ?? 0
      }));
    }
  };
  //   // Update map position when x or y coordinates change
  //   if (field === 'x' || field === 'y') {
  //     setSelectedMapPosition(prev => ({
  //       ...prev,
  //       [field]: numValue
  //     }));
  //   }
  // };

  const handleRoomChange = (room: string) => {
    setCoordinates(prev => ({
      ...prev,
      room
    }));
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 20 - 10; // Scale to -10 to 10
    const y = ((e.clientY - rect.top) / rect.height) * 20 - 10; // Scale to -10 to 10
    
    setSelectedMapPosition({ x, y });
    setCoordinates(prev => ({
      ...prev,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10
    }));
    
    toast({
      title: "Position Selected",
      description: `Coordinates: (${Math.round(x * 10) / 10}, ${Math.round(y * 10) / 10})`,
    });
  };

  const setPreset = (presetName: string) => {
    const presets = {
      home: { x: 0, y: 0, floor: 1, yaw: 0, room: 'reception' },
      emergency: { x: -8, y: 5, floor: 1, yaw: 90, room: 'emergency' },
      surgery: { x: 6, y: 3, floor: 2, yaw: 180, room: 'surgery' },
      icu: { x: -3, y: -7, floor: 3, yaw: 270, room: 'icu' },
      pharmacy: { x: 4, y: -2, floor: 1, yaw: 0, room: 'pharmacy' },
      lab: { x: -6, y: 8, floor: 1, yaw: 45, room: 'lab' },
    };
    
    const preset = presets[presetName];
    if (preset) {
      setCoordinates(preset);
      setSelectedMapPosition({ x: preset.x, y: preset.y });
      toast({
        title: "Preset Loaded",
        description: `Robot set to ${presetName}`,
      });
    }
  };

  const handleZoomIn = () =>
    setZoomLevel((prev) => [Math.min(prev[0] + 25, 200)]);
  const handleZoomOut = () =>
    setZoomLevel((prev) => [Math.max(prev[0] - 25, 50)]);

  return (
    <Card className="bg-slate-800/60 backdrop-blur-xl border border-cyan-500/20 shadow-2xl">
      <CardHeader>
        <CardTitle className="text-cyan-100">Robot Control</CardTitle>
        <CardDescription className="text-slate-400">
          Send movement commands to the robot
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Interactive Map */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-cyan-200 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Hospital Map - Click to Select Position
              </h3>
              
              {/* Zoom Controls */}
              <div className="flex items-center space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={disabled || zoomLevel[0] <= 50}
                  className="border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10 p-2"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                
                <div className="w-24">
                  <Slider
                    value={zoomLevel}
                    onValueChange={setZoomLevel}
                    min={50}
                    max={200}
                    step={25}
                    disabled={disabled}
                    className="w-full"
                  />
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={disabled || zoomLevel[0] >= 200}
                  className="border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10 p-2"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                
                <span className="text-xs text-cyan-300 min-w-[3rem]">
                  {zoomLevel[0]}%
                </span>
              </div>
            </div>
            
            <div className="relative w-[500px] h-[500px] mx-auto overflow-hidden rounded-lg border border-cyan-500/20 cursor-crosshair" onClick={handleMapClick}>
              {/* Map image, centered and scalable */}
              <img
                src="/uploads/Map.png"
                alt="Hospital Map"
                draggable={false}
                className="absolute top-1/2 left-1/2 select-none"
                style={{
                  transform: `translate(-50%, -50%) scale(${zoomLevel[0]/ 100})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease-in-out',
                }}
              />
              {/* Grid overlay */}
              <div className="absolute inset-0 opacity-20">
                {[...Array(11)].map((_, i) => (
                  <div key={`v-${i}`} className="absolute h-full w-px bg-cyan-400" style={{ left: `${i * 10}%` }} />
                ))}
                {[...Array(11)].map((_, i) => (
                  <div key={`h-${i}`} className="absolute w-full h-px bg-cyan-400" style={{ top: `${i * 10}%` }} />
                ))}
              </div>
              
              {/* Room indicators positioned based on the floor plan */}
              <div className="absolute top-4 left-6 w-3 h-3 bg-red-500 rounded-full opacity-90 shadow-lg border border-white" title="Emergency" />
              <div className="absolute top-6 right-8 w-3 h-3 bg-blue-500 rounded-full opacity-90 shadow-lg border border-white" title="Surgery" />
              <div className="absolute bottom-8 left-4 w-3 h-3 bg-green-500 rounded-full opacity-90 shadow-lg border border-white" title="ICU" />
              <div className="absolute bottom-6 right-6 w-3 h-3 bg-purple-500 rounded-full opacity-90 shadow-lg border border-white" title="Pharmacy" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-500 rounded-full opacity-90 shadow-lg border border-white" title="Reception (Home)" />
              
              {/* Selected position with orientation arrow */}
              {selectedMapPosition && (
                <div 
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ 
                    left: `${((selectedMapPosition.x + 10) / 20) * 100}%`,
                    top: `${((selectedMapPosition.y + 10) / 20) * 100}%`
                  }}
                >
                  {/* Robot position indicator */}
                  <div className="w-5 h-5 bg-cyan-400 rounded-full border-2 border-white animate-pulse shadow-lg" />
                  
                  {/* Orientation arrow */}
                  <div 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 pointer-events-none"
                    style={{ 
                      transform: `translate(-50%, -50%) rotate(${coordinates.yaw}deg)` 
                    }}
                  >
                    <svg 
                      width="40" 
                      height="40" 
                      viewBox="0 0 40 40" 
                      className="text-cyan-300 drop-shadow-lg"
                    >
                      <path 
                        d="M20 6 L26 18 L20 14 L14 18 Z" 
                        fill="currentColor" 
                        stroke="white" 
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                </div>
              )}
              
              <div className="absolute bottom-1 right-1 text-xs text-cyan-300 bg-slate-800/80 px-2 py-1 rounded">
                Click to set position
              </div>
            </div>
          </div>

          {/* Position Controls */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-cyan-200">Position (meters)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="x" className="text-cyan-200">X</Label>
                <Input
                  id="x"
                  type="number"
                  step="0.1"
                  value={coordinates.x}
                  onChange={(e) => handleInputChange('x', e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-cyan-100"
                  disabled={disabled}
                />
              </div>
              <div>
                <Label htmlFor="y" className="text-cyan-200">Y</Label>
                <Input
                  id="y"
                  type="number"
                  step="0.1"
                  value={coordinates.y}
                  onChange={(e) => handleInputChange('y', e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-cyan-100"
                  disabled={disabled}
                />
              </div>
            </div>
          </div>

          {/* Floor and Orientation Controls */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-cyan-200">Floor & Orientation</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="floor" className="text-cyan-200">Floor Number</Label>
                <Input
                  id="floor"
                  type="number"
                  min="1"
                  max="10"
                  value={coordinates.floor}
                  onChange={(e) => handleInputChange('floor', e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-cyan-100"
                  disabled={disabled}
                />
              </div>
              <div>
                <Label htmlFor="yaw" className="text-cyan-200">Yaw (degrees)</Label>
                <Input
                  id="yaw"
                  type="number"
                  step="1"
                  min="-180"
                  max="180"
                  value={coordinates.yaw}
                  onChange={(e) => handleInputChange('yaw', e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-cyan-100"
                  disabled={disabled}
                />
              </div>
            </div>
          </div>

          {/* Room Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-cyan-200">Destination Room</h3>
            <Select value={coordinates.room} onValueChange={handleRoomChange} disabled={disabled}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-cyan-100">
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {rooms.map((room) => (
                  <SelectItem key={room.value} value={room.value} className="text-cyan-100 hover:bg-slate-700">
                    {room.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-cyan-200">Quick Presets</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreset('home')}
                disabled={disabled}
                className="border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10"
              >
                Home
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreset('emergency')}
                disabled={disabled}
                className="border-red-500/30 text-red-200 hover:bg-red-500/10"
              >
                Emergency
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreset('surgery')}
                disabled={disabled}
                className="border-blue-500/30 text-blue-200 hover:bg-blue-500/10"
              >
                Surgery
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreset('icu')}
                disabled={disabled}
                className="border-green-500/30 text-green-200 hover:bg-green-500/10"
              >
                ICU
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreset('pharmacy')}
                disabled={disabled}
                className="border-purple-500/30 text-purple-200 hover:bg-purple-500/10"
              >
                Pharmacy
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreset('lab')}
                disabled={disabled}
                className="border-yellow-500/30 text-yellow-200 hover:bg-yellow-500/10"
              >
                Lab
              </Button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={disabled}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white border-0 transition-all duration-300"
            size="lg"
          >
            {disabled ? 'Robot Busy...' : 'Send Robot Command'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
