import torch
import platform

# 1. Check PyTorch Version (Need >= 1.12, ideally >= 2.0 for better MPS support)
print(f"PyTorch Version: {torch.__version__}")

# 2. Check if MPS is built into your PyTorch binary
#    (Should be True for recent macOS arm64 builds)
print(f"MPS Built-in: {torch.backends.mps.is_built()}")

# 3. Check if MPS is available and ready for use on your system
#    (This is the most important check for usability)
print(f"MPS Available: {torch.backends.mps.is_available()}")

# 4. Check your Python's architecture (should be 'arm64' for native M1/M2/M3)
print(f"Python Platform: {platform.platform()}")
print(f"Python Architecture: {platform.machine()}") # Should be 'arm64'

# 5. Try allocating a tensor to the MPS device (if available)
if torch.backends.mps.is_available():
    try:
        device = torch.device("mps")
        x = torch.ones(1, device=device)
        print("Successfully created a tensor on MPS device:")
        print(x)
    except Exception as e:
        print(f"Could not create tensor on MPS device: {e}")
else:
    print("MPS device not available.")

# Exit Python interpreter if running interactively
# exit()