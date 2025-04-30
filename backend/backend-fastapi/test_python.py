import os
import ctypes

# Find correct libllama.dylib
current_dir = os.path.dirname(__file__)
libllama_path = os.path.join(current_dir, "lib", "libllama.dylib")

# Manually load it before llama_cpp does anything
ctypes.CDLL(libllama_path)

from llama_cpp import Llama

# Now create your Llama instance
llm = Llama(
    model_path="backend/lib/Prometheus 7B v2.0 GGUF.gguf",  # REPLACE THIS WITH YOUR MODEL PATH
    n_ctx=512,
    n_threads=6,
)

# Example prompt
output = llm("What is 2+2?")
print(output)