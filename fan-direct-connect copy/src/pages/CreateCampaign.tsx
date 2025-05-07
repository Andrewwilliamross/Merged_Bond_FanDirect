
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MapPin, Hash, Calendar, Image, Send, X, Plus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import DashboardLayout from '../components/DashboardLayout';
import GradientButton from '../components/GradientButton';

interface Tag {
  id: string;
  name: string;
}

const CreateCampaign = () => {
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedAudience, setSelectedAudience] = useState('all');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [media, setMedia] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const availableTags = [
    { id: '1', name: 'VIP' },
    { id: '2', name: 'Early Adopter' },
    { id: '3', name: 'Inactive' },
    { id: '4', name: 'Recent Subscriber' },
    { id: '5', name: 'High Engagement' },
  ];
  
  const filteredTags = availableTags.filter(tag => 
    !selectedTags.some(selected => selected.id === tag.id) && 
    tag.name.toLowerCase().includes(tagInput.toLowerCase())
  );
  
  const handleAddTag = (tag: Tag) => {
    setSelectedTags(prev => [...prev, tag]);
    setTagInput('');
  };
  
  const handleRemoveTag = (id: string) => {
    setSelectedTags(prev => prev.filter(tag => tag.id !== id));
  };
  
  const handleAddLocation = () => {
    if (locationInput && !selectedLocations.includes(locationInput)) {
      setSelectedLocations(prev => [...prev, locationInput]);
      setLocationInput('');
    }
  };
  
  const handleRemoveLocation = (location: string) => {
    setSelectedLocations(prev => prev.filter(loc => loc !== location));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setMedia(prev => [...prev, ...newFiles]);
    }
  };
  
  const handleRemoveMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };
  
  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};
    
    if (currentStep === 1) {
      if (!title) {
        newErrors.title = 'Campaign title is required';
      }
      
      if (!selectedAudience) {
        newErrors.audience = 'Please select an audience';
      }
      
      if (selectedAudience === 'tags' && selectedTags.length === 0) {
        newErrors.tags = 'Please select at least one tag';
      }
      
      if (selectedAudience === 'location' && selectedLocations.length === 0) {
        newErrors.locations = 'Please add at least one location';
      }
    }
    
    if (currentStep === 2) {
      if (!message) {
        newErrors.message = 'Message content is required';
      }
      
      if (!scheduledDate) {
        newErrors.scheduledDate = 'Please select a date';
      }
      
      if (!scheduledTime) {
        newErrors.scheduledTime = 'Please select a time';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };
  
  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };
  
  const handleSubmit = () => {
    if (validateStep(step)) {
      setIsLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);
        toast.success('Campaign created successfully!');
        navigate('/dashboard/campaigns');
      }, 1500);
    }
  };

  return (
    <DashboardLayout title="Create New Campaign">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${step >= 1 ? 'text-brand-blue' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-brand-blue text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                <Users className="h-5 w-5" />
              </div>
              <span className="ml-2 font-medium">Audience</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-brand-blue' : 'bg-gray-200'}`} />
            <div className={`flex items-center ${step >= 2 ? 'text-brand-blue' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-brand-blue text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                <Send className="h-5 w-5" />
              </div>
              <span className="ml-2 font-medium">Message</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step >= 3 ? 'bg-brand-blue' : 'bg-gray-200'}`} />
            <div className={`flex items-center ${step >= 3 ? 'text-brand-blue' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= 3 ? 'bg-brand-blue text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                <Send className="h-5 w-5" />
              </div>
              <span className="ml-2 font-medium">Review</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          {/* Step 1: Audience */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Campaign Details & Audience</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={cn(
                      "block w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-offset-2 focus:outline-none",
                      errors.title
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-brand-blue focus:ring-brand-blue"
                    )}
                    placeholder="e.g. Weekend Update, New Product Announcement"
                  />
                  {errors.title && (
                    <div className="mt-1 flex items-center text-sm text-red-600">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span>{errors.title}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Audience
                  </label>
                  
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="all"
                        checked={selectedAudience === 'all'}
                        onChange={() => setSelectedAudience('all')}
                        className="h-4 w-4 text-brand-blue focus:ring-brand-blue border-gray-300"
                      />
                      <span className="ml-2 text-gray-700">All Subscribers</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="tags"
                        checked={selectedAudience === 'tags'}
                        onChange={() => setSelectedAudience('tags')}
                        className="h-4 w-4 text-brand-blue focus:ring-brand-blue border-gray-300"
                      />
                      <span className="ml-2 text-gray-700">By Tags/Segments</span>
                    </label>
                    
                    {selectedAudience === 'tags' && (
                      <div className="ml-6 mt-2">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {selectedTags.map(tag => (
                            <div key={tag.id} className="flex items-center bg-brand-lightgray px-3 py-1 rounded-full">
                              <span className="text-sm">{tag.name}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag.id)}
                                className="ml-1 text-gray-500 hover:text-red-500"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Hash className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            placeholder="Search tags"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-2 focus:outline-none focus:border-brand-blue focus:ring-brand-blue"
                          />
                        </div>
                        
                        {tagInput && filteredTags.length > 0 && (
                          <div className="mt-1 bg-white border border-gray-300 rounded-md shadow-sm overflow-hidden">
                            <ul className="divide-y divide-gray-200">
                              {filteredTags.map(tag => (
                                <li key={tag.id}>
                                  <button
                                    type="button"
                                    onClick={() => handleAddTag(tag)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                                  >
                                    {tag.name}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {errors.tags && (
                          <div className="mt-1 flex items-center text-sm text-red-600">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            <span>{errors.tags}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="location"
                        checked={selectedAudience === 'location'}
                        onChange={() => setSelectedAudience('location')}
                        className="h-4 w-4 text-brand-blue focus:ring-brand-blue border-gray-300"
                      />
                      <span className="ml-2 text-gray-700">By Location</span>
                    </label>
                    
                    {selectedAudience === 'location' && (
                      <div className="ml-6 mt-2">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {selectedLocations.map(location => (
                            <div key={location} className="flex items-center bg-brand-lightgray px-3 py-1 rounded-full">
                              <span className="text-sm">{location}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveLocation(location)}
                                className="ml-1 text-gray-500 hover:text-red-500"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex">
                          <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <MapPin className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              value={locationInput}
                              onChange={(e) => setLocationInput(e.target.value)}
                              placeholder="Add location (city, state, country)"
                              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-offset-2 focus:outline-none focus:border-brand-blue focus:ring-brand-blue"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleAddLocation}
                            className="bg-brand-blue text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 focus:outline-none"
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                        </div>
                        
                        {errors.locations && (
                          <div className="mt-1 flex items-center text-sm text-red-600">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            <span>{errors.locations}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {errors.audience && (
                    <div className="mt-1 flex items-center text-sm text-red-600">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span>{errors.audience}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                <GradientButton onClick={handleNextStep}>
                  Next Step
                </GradientButton>
              </div>
            </div>
          )}
          
          {/* Step 2: Message */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Compose Message</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message Content
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    className={cn(
                      "block w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-offset-2 focus:outline-none resize-none",
                      errors.message
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-brand-blue focus:ring-brand-blue"
                    )}
                    placeholder="Type your message here..."
                  />
                  {errors.message && (
                    <div className="mt-1 flex items-center text-sm text-red-600">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span>{errors.message}</span>
                    </div>
                  )}
                  <div className="mt-1 text-right text-sm text-gray-500">
                    {message.length} / 1600 characters
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Media (Optional)
                  </label>
                  
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-4 mb-3">
                      {media.map((file, index) => (
                        <div key={index} className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Uploaded media ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveMedia(index)}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      
                      <label className="flex flex-col items-center justify-center w-20 h-20 bg-gray-100 rounded-lg border border-dashed border-gray-300 cursor-pointer hover:bg-gray-50">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Image className="h-6 w-6 text-gray-400" />
                          <p className="text-xs text-gray-500">Add</p>
                        </div>
                        <input type="file" className="hidden" onChange={handleFileChange} accept="image/*,video/*" />
                      </label>
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      Supported formats: JPG, PNG, GIF, MP4 (Max 10MB)
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Schedule Date
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className={cn(
                          "block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-offset-2 focus:outline-none",
                          errors.scheduledDate
                            ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:border-brand-blue focus:ring-brand-blue"
                        )}
                      />
                    </div>
                    {errors.scheduledDate && (
                      <div className="mt-1 flex items-center text-sm text-red-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        <span>{errors.scheduledDate}</span>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Schedule Time
                    </label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className={cn(
                        "block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-offset-2 focus:outline-none",
                        errors.scheduledTime
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-brand-blue focus:ring-brand-blue"
                      )}
                    />
                    {errors.scheduledTime && (
                      <div className="mt-1 flex items-center text-sm text-red-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        <span>{errors.scheduledTime}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-between">
                <GradientButton variant="outline" onClick={handlePrevStep}>
                  Back
                </GradientButton>
                <GradientButton onClick={handleNextStep}>
                  Review Campaign
                </GradientButton>
              </div>
            </div>
          )}
          
          {/* Step 3: Review */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Review Campaign</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Campaign Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Campaign Title</p>
                      <p className="font-medium">{title}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Audience</p>
                      <p className="font-medium">
                        {selectedAudience === 'all' ? 'All Subscribers' : 
                         selectedAudience === 'tags' ? `Selected Tags (${selectedTags.length})` : 
                         `Selected Locations (${selectedLocations.length})`}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Schedule</p>
                      <p className="font-medium">
                        {scheduledDate} at {scheduledTime}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Media</p>
                      <p className="font-medium">
                        {media.length === 0 ? 'None' : `${media.length} attached`}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Message Preview</h3>
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="bg-brand-blue/10 rounded-2xl rounded-tl-none p-4 self-start max-w-md">
                      <p className="whitespace-pre-wrap">{message}</p>
                      
                      {media.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {media.map((file, index) => (
                            <img
                              key={index}
                              src={URL.createObjectURL(file)}
                              alt={`Uploaded media ${index + 1}`}
                              className="h-20 w-auto rounded-lg"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-800 mb-1">Important Notes</h3>
                  <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                    <li>This message will be sent to {selectedAudience === 'all' ? 'all of your subscribers' : `subscribers matching your ${selectedAudience} criteria`}.</li>
                    <li>Scheduled for {scheduledDate} at {scheduledTime}.</li>
                    <li>You can cancel this campaign any time before the scheduled send time.</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-8 flex justify-between">
                <GradientButton variant="outline" onClick={handlePrevStep}>
                  Back
                </GradientButton>
                <GradientButton onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? 'Creating Campaign...' : 'Schedule Campaign'}
                </GradientButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateCampaign;
