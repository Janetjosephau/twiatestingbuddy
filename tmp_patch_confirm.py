import os
import re

def install_custom_confirm(filepath, api_name):
    if not os.path.exists(filepath):
        print(f"Skipping {filepath}")
        return
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if "const [deleteConfirmId" in content:
        return # already patched

    # Add State
    content = re.sub(
        r'(const \[errorModal, setErrorModal\].*?)\n',
        r'\1\n  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)\n',
        content, count=1
    )

    # Rewrite handleDelete to just set state
    # Handle both versions of handleDelete correctly
    old_handle_delete_regex = r"const handleDelete = async \(id: string\) => \{\s*if \(window\.confirm\([^)]+\)\) \{\s*try \{\s*await " + api_name + r"\.deleteConfig\(id\)\s*toast\.success\('[^']+'\)\s*await fetchConfigs\(\)\s*\} catch \([^)]*\) \{\s*(?:toast\.error\('[^']+'\)|setErrorModal\(\{[^}]+\}\))\s*\}\s*\}\s*\}"

    new_handle_delete = f"""const handleDelete = (id: string) => {{
    setDeleteConfirmId(id)
  }}

  const confirmDelete = async () => {{
    if (!deleteConfirmId) return
    try {{
      await {api_name}.deleteConfig(deleteConfirmId)
      toast.success('Configuration Deleted')
      await fetchConfigs()
    }} catch (error: any) {{
      setErrorModal({{ title: 'Operation Failed', detail: error?.response?.data?.message || 'Failed to delete configuration' }})
    }} finally {{
      setDeleteConfirmId(null)
    }}
  }}"""

    # Do replacement of handleDelete
    content = re.sub(old_handle_delete_regex, new_handle_delete, content)

    # Add Modal JSX before the final </div>)
    modal_jsx = """
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={40} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Delete Configuration?</h2>
              <p className="text-slate-500 font-medium mb-8">This action cannot be undone. Are you sure you want to permanently delete this?</p>
              <div className="flex space-x-4">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 h-14 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 h-14 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all">Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    """
    
    content = re.sub(r'(</div>\s*)\)\s*$', r'\1' + modal_jsx + r')\n', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)


base = r'd:\AIBluePrint_VSCode\QaTestingBuddy AI\frontend\src\pages'
install_custom_confirm(os.path.join(base, 'LLMConfiguration.tsx'), 'llmApi')
install_custom_confirm(os.path.join(base, 'RallyIntegration.tsx'), 'rallyApi')
