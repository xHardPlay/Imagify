import React from 'react';
import { Rocket, Wand2, Zap, ArrowRight } from 'lucide-react';

const CreatePage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-brutal-lime border-4 border-brutal-black mb-6" style={{ boxShadow: '6px 6px 0px 0px #000000' }}>
          <Rocket className="h-10 w-10" />
        </div>
        <h1 className="text-4xl font-black uppercase mb-4">Create</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Execute your AI pipelines and generate amazing content from your workflows.
        </p>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-brutal-white border-4 border-brutal-black p-8" style={{ boxShadow: '8px 8px 0px 0px #000000' }}>
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-brutal-yellow border-3 border-brutal-black">
            <Zap className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black uppercase">Coming Soon</h2>
        </div>

        <p className="text-gray-600 mb-8">
          This section will allow you to run your pipelines from the Plan section and generate:
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="p-4 border-3 border-brutal-black bg-brutal-magenta/20">
            <div className="flex items-center space-x-3 mb-2">
              <Wand2 className="h-5 w-5" />
              <h3 className="font-bold uppercase">AI Images</h3>
            </div>
            <p className="text-sm text-gray-600">
              Generate images using FLUX, Stable Diffusion, or DALL-E based on your analysis variables.
            </p>
          </div>

          <div className="p-4 border-3 border-brutal-black bg-brutal-yellow/20">
            <div className="flex items-center space-x-3 mb-2">
              <ArrowRight className="h-5 w-5" />
              <h3 className="font-bold uppercase">AI Stories</h3>
            </div>
            <p className="text-sm text-gray-600">
              Create compelling narratives, product descriptions, or social media content.
            </p>
          </div>
        </div>

        <div className="p-4 bg-brutal-cyan/20 border-3 border-brutal-black">
          <p className="text-sm font-bold uppercase mb-1">Next Steps:</p>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Create an analysis in the <strong>Analyze</strong> section</li>
            <li>Design a pipeline in the <strong>Plan</strong> section</li>
            <li>Come back here to run your creation pipeline!</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;
