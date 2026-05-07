import os
import re

def patch_file(filepath, screen_name):
    if not os.path.exists(filepath):
        print(f"{filepath} not found")
        return
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if "const [errorModal" not in content:
        # Add state
        content = re.sub(r'(const \[[a-zA-Z]+, set[a-zA-Z]+\] = useState.*?)\n', 
                         r'\1\n  const [errorModal, setErrorModal] = useState<{ title: string; detail: string } | null>(null)\n', 
                         content, count=1)
                         
    if "XCircle" not in content:
        # Import XCircle
        content = re.sub(r"import \{([^}]+)\} from 'lucide-react'", 
                         r"import {\1, XCircle} from 'lucide-react'", 
                         content)

    # Replace catch Toast errors with explicitly setting errorModal
    # catch (error: any) { toast.error(message) }
    
    # Simple regex replacing toast.error to setErrorModal if it's inside a catch
    content = re.sub(r"toast\.error\((error\?\.response\?\.data\?\.message[^)]+)\)", 
                     r"setErrorModal({ title: 'Operation Failed', detail: \1 })", 
                     content)

    # Modal JSX
    modal_jsx = f"""
      {{errorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={{() => setErrorModal(null)}}
          />
          <div className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
            <div className="h-2 w-full bg-gradient-to-r from-red-500 to-rose-500" />
            <div className="p-10">
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-red-50 border-2 border-red-100 flex items-center justify-center flex-shrink-0">
                  <XCircle size={{32}} className="text-red-500" />
                </div>
                <div className="pt-1">
                  <h2 className="text-xl font-black text-slate-900">{{errorModal?.title}}</h2>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Configuration Error · {screen_name}</p>
                </div>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-8">
                <p className="text-sm font-bold text-red-700 leading-relaxed">{{errorModal?.detail}}</p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={{() => setErrorModal(null)}}
                  className="flex-1 h-12 bg-slate-900 text-white rounded-xl font-black hover:bg-slate-800 transition-all"
                >
                  Close Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}}
    """
    
    if "errorModal && (" not in content:
        # Inject just before the final </div>
        content = re.sub(r'(</div>\s*)\)\s*$', r'\1' + modal_jsx + r')\n', content)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

base = r'd:\AIBluePrint_VSCode\QaTestingBuddy AI\frontend\src\pages'
patch_file(os.path.join(base, 'LLMConfiguration.tsx'), 'LLM Setup')
patch_file(os.path.join(base, 'RallyIntegration.tsx'), 'Rally Setup')
