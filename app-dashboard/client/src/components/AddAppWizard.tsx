/**
 * Add Application Wizard Component
 * Multi-step wizard for creating new applications
 */

import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check, AlertCircle } from 'lucide-react';
import { useUIStore, useDataStore } from '../hooks/useStore';
import { createApplication, markGlobalIdeaConverted } from '../services/api';
import type { WizardStep1Data, WizardStep2Data, WizardStep3Data, BuildPlatform, DatabasePlatform, FrontendPlatform } from '../types';
import { isValidUrl } from '../utils/helpers';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 1, title: 'Basic Info', titleHe: 'מידע בסיסי' },
  { id: 2, title: 'Links', titleHe: 'קישורים' },
  { id: 3, title: 'Platform Config', titleHe: 'הגדרות פלטפורמה' },
  { id: 4, title: 'Review', titleHe: 'סיכום' },
];

const BUILD_PLATFORMS: { value: BuildPlatform; label: string }[] = [
  { value: 'vibe_coding', label: 'Vibe Coding' },
  { value: 'vercel', label: 'Vercel' },
  { value: 'netlify', label: 'Netlify' },
  { value: 'railway', label: 'Railway' },
  { value: 'render', label: 'Render' },
  { value: 'custom', label: 'Custom' },
];

const DATABASE_PLATFORMS: { value: DatabasePlatform; label: string }[] = [
  { value: null, label: 'None' },
  { value: 'supabase', label: 'Supabase' },
  { value: 'firebase', label: 'Firebase' },
  { value: 'planetscale', label: 'PlanetScale' },
  { value: 'custom', label: 'Custom' },
];

const FRONTEND_PLATFORMS: { value: FrontendPlatform; label: string }[] = [
  { value: null, label: 'None' },
  { value: 'vercel', label: 'Vercel' },
  { value: 'netlify', label: 'Netlify' },
  { value: 'custom', label: 'Custom' },
];

export default function AddAppWizard() {
  const { closeAddAppWizard, wizardPrefill, isRTL } = useUIStore();
  const { addApplication, updateGlobalIdeaInStore } = useDataStore();
  const convertingGlobalIdeaId = useUIStore((s) => s.convertingGlobalIdeaId);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [step1Data, setStep1Data] = useState<WizardStep1Data>({
    name: wizardPrefill?.name || '',
    description: wizardPrefill?.description || '',
    build_platform: (wizardPrefill?.build_platform as BuildPlatform) || 'custom',
  });

  const [step2Data, setStep2Data] = useState<WizardStep2Data>({
    github_url: wizardPrefill?.github_url || '',
    database_url: wizardPrefill?.database_url || '',
    database_platform: (wizardPrefill?.database_platform as DatabasePlatform) || null,
    frontend_url: wizardPrefill?.frontend_url || '',
    frontend_platform: (wizardPrefill?.frontend_platform as FrontendPlatform) || null,
    live_url: wizardPrefill?.live_url || '',
  });

  const [step3Data, setStep3Data] = useState<WizardStep3Data>({
    platform_config: {},
  });

  // Validation
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!step1Data.name.trim()) {
      newErrors.name = isRTL ? 'שם האפליקציה נדרש' : 'Application name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (step2Data.github_url && !isValidUrl(step2Data.github_url)) {
      newErrors.github_url = isRTL ? 'כתובת URL לא תקינה' : 'Invalid URL format';
    }
    if (step2Data.database_url && !isValidUrl(step2Data.database_url)) {
      newErrors.database_url = isRTL ? 'כתובת URL לא תקינה' : 'Invalid URL format';
    }
    if (step2Data.frontend_url && !isValidUrl(step2Data.frontend_url)) {
      newErrors.frontend_url = isRTL ? 'כתובת URL לא תקינה' : 'Invalid URL format';
    }
    if (step2Data.live_url && !isValidUrl(step2Data.live_url)) {
      newErrors.live_url = isRTL ? 'כתובת URL לא תקינה' : 'Invalid URL format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await createApplication({
        name: step1Data.name.trim(),
        description: step1Data.description.trim() || undefined,
        build_platform: step1Data.build_platform,
        github_url: step2Data.github_url.trim() || undefined,
        database_url: step2Data.database_url.trim() || undefined,
        database_platform: step2Data.database_platform,
        frontend_url: step2Data.frontend_url.trim() || undefined,
        frontend_platform: step2Data.frontend_platform,
        live_url: step2Data.live_url.trim() || undefined,
        platform_config: Object.keys(step3Data.platform_config).length > 0 ? step3Data.platform_config : undefined,
      });

      if (response.success && response.data) {
        addApplication(response.data);

        // If converting from global idea, mark it as converted
        if (convertingGlobalIdeaId) {
          const convertResponse = await markGlobalIdeaConverted(convertingGlobalIdeaId, response.data.id);
          if (convertResponse.success && convertResponse.data) {
            updateGlobalIdeaInStore(convertResponse.data);
          }
        }

        toast.success(isRTL ? 'האפליקציה נוצרה בהצלחה' : 'Application created successfully');
        closeAddAppWizard();
      } else {
        toast.error(response.error || 'Failed to create application');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="label">
                {isRTL ? 'שם האפליקציה' : 'Application Name'} *
              </label>
              <input
                type="text"
                value={step1Data.name}
                onChange={(e) => setStep1Data({ ...step1Data, name: e.target.value })}
                className={`input ${errors.name ? 'input-error' : ''}`}
                placeholder={isRTL ? 'הכנס שם...' : 'Enter name...'}
                autoFocus
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="label">
                {isRTL ? 'תיאור' : 'Description'} ({isRTL ? 'אופציונלי' : 'optional'})
              </label>
              <textarea
                value={step1Data.description}
                onChange={(e) => setStep1Data({ ...step1Data, description: e.target.value })}
                className="input min-h-[100px]"
                placeholder={isRTL ? 'תיאור קצר של האפליקציה...' : 'Brief description of the application...'}
              />
            </div>

            <div>
              <label className="label">
                {isRTL ? 'פלטפורמת בנייה' : 'Build Platform'} *
              </label>
              <select
                value={step1Data.build_platform}
                onChange={(e) => setStep1Data({ ...step1Data, build_platform: e.target.value as BuildPlatform })}
                className="select"
              >
                {BUILD_PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label className="label">GitHub Repository URL</label>
              <input
                type="url"
                value={step2Data.github_url}
                onChange={(e) => setStep2Data({ ...step2Data, github_url: e.target.value })}
                className={`input ${errors.github_url ? 'input-error' : ''}`}
                placeholder="https://github.com/..."
              />
              {errors.github_url && (
                <p className="text-sm text-red-500 mt-1">{errors.github_url}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">{isRTL ? 'פלטפורמת מסד נתונים' : 'Database Platform'}</label>
                <select
                  value={step2Data.database_platform || ''}
                  onChange={(e) =>
                    setStep2Data({
                      ...step2Data,
                      database_platform: (e.target.value || null) as DatabasePlatform,
                    })
                  }
                  className="select"
                >
                  {DATABASE_PLATFORMS.map((p) => (
                    <option key={p.value || 'none'} value={p.value || ''}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Database URL</label>
                <input
                  type="url"
                  value={step2Data.database_url}
                  onChange={(e) => setStep2Data({ ...step2Data, database_url: e.target.value })}
                  className={`input ${errors.database_url ? 'input-error' : ''}`}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">{isRTL ? 'פלטפורמת Frontend' : 'Frontend Platform'}</label>
                <select
                  value={step2Data.frontend_platform || ''}
                  onChange={(e) =>
                    setStep2Data({
                      ...step2Data,
                      frontend_platform: (e.target.value || null) as FrontendPlatform,
                    })
                  }
                  className="select"
                >
                  {FRONTEND_PLATFORMS.map((p) => (
                    <option key={p.value || 'none'} value={p.value || ''}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Frontend Platform URL</label>
                <input
                  type="url"
                  value={step2Data.frontend_url}
                  onChange={(e) => setStep2Data({ ...step2Data, frontend_url: e.target.value })}
                  className={`input ${errors.frontend_url ? 'input-error' : ''}`}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label className="label">Live Site URL</label>
              <input
                type="url"
                value={step2Data.live_url}
                onChange={(e) => setStep2Data({ ...step2Data, live_url: e.target.value })}
                className={`input ${errors.live_url ? 'input-error' : ''}`}
                placeholder="https://..."
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isRTL
                ? 'הגדרות אופציונליות לאינטגרציה עם פלטפורמות. אפשר לדלג על שלב זה.'
                : 'Optional configuration for platform integrations. You can skip this step.'}
            </p>

            {step1Data.build_platform === 'vercel' && (
              <div>
                <label className="label">Vercel Project ID</label>
                <input
                  type="text"
                  value={step3Data.platform_config.vercel_project_id || ''}
                  onChange={(e) =>
                    setStep3Data({
                      platform_config: {
                        ...step3Data.platform_config,
                        vercel_project_id: e.target.value,
                      },
                    })
                  }
                  className="input"
                  placeholder="prj_..."
                />
              </div>
            )}

            {step2Data.database_platform === 'supabase' && (
              <div>
                <label className="label">Supabase Project Ref</label>
                <input
                  type="text"
                  value={step3Data.platform_config.supabase_project_ref || ''}
                  onChange={(e) =>
                    setStep3Data({
                      platform_config: {
                        ...step3Data.platform_config,
                        supabase_project_ref: e.target.value,
                      },
                    })
                  }
                  className="input"
                  placeholder="xxxxxxxxxxxxxxxxxxxx"
                />
              </div>
            )}

            <div>
              <label className="label">{isRTL ? 'הערות נוספות' : 'Additional Notes'}</label>
              <textarea
                value={step3Data.platform_config.notes || ''}
                onChange={(e) =>
                  setStep3Data({
                    platform_config: {
                      ...step3Data.platform_config,
                      notes: e.target.value,
                    },
                  })
                }
                className="input min-h-[80px]"
                placeholder={isRTL ? 'הערות על ההגדרות...' : 'Notes about configuration...'}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">
              {isRTL ? 'סקירת הפרטים' : 'Review Details'}
            </h3>

            <div className="card p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  {isRTL ? 'שם:' : 'Name:'}
                </span>
                <span className="font-medium">{step1Data.name}</span>

                {step1Data.description && (
                  <>
                    <span className="text-gray-500 dark:text-gray-400">
                      {isRTL ? 'תיאור:' : 'Description:'}
                    </span>
                    <span>{step1Data.description}</span>
                  </>
                )}

                <span className="text-gray-500 dark:text-gray-400">
                  {isRTL ? 'פלטפורמה:' : 'Platform:'}
                </span>
                <span>{BUILD_PLATFORMS.find((p) => p.value === step1Data.build_platform)?.label}</span>

                {step2Data.github_url && (
                  <>
                    <span className="text-gray-500 dark:text-gray-400">GitHub:</span>
                    <span className="truncate">{step2Data.github_url}</span>
                  </>
                )}

                {step2Data.database_platform && (
                  <>
                    <span className="text-gray-500 dark:text-gray-400">Database:</span>
                    <span>{DATABASE_PLATFORMS.find((p) => p.value === step2Data.database_platform)?.label}</span>
                  </>
                )}

                {step2Data.frontend_platform && (
                  <>
                    <span className="text-gray-500 dark:text-gray-400">Frontend:</span>
                    <span>{FRONTEND_PLATFORMS.find((p) => p.value === step2Data.frontend_platform)?.label}</span>
                  </>
                )}

                {step2Data.live_url && (
                  <>
                    <span className="text-gray-500 dark:text-gray-400">Live URL:</span>
                    <span className="truncate">{step2Data.live_url}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay" onClick={closeAddAppWizard}>
      <div
        className="modal-content w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isRTL ? 'הוספת אפליקציה חדשה' : 'Add New Application'}
          </h2>
          <button onClick={closeAddAppWizard} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${
                      currentStep > step.id
                        ? 'bg-primary-600 text-white'
                        : currentStep === step.id
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                    }
                  `}
                >
                  {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                </div>
                <span
                  className={`ml-2 text-sm hidden sm:inline ${
                    currentStep === step.id
                      ? 'text-primary-700 dark:text-primary-300 font-medium'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {isRTL ? step.titleHe : step.title}
                </span>
                {index < STEPS.length - 1 && (
                  <div className="w-8 sm:w-16 h-0.5 mx-2 bg-gray-200 dark:bg-gray-700" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="btn-secondary flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {isRTL ? 'הקודם' : 'Back'}
          </button>

          {currentStep < 4 ? (
            <button onClick={handleNext} className="btn-primary flex items-center gap-2">
              {isRTL ? 'הבא' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-primary flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">...</span>
                  {isRTL ? 'יוצר...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {isRTL ? 'צור אפליקציה' : 'Create Application'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
