---
thumbnail: "https://assets-global.website-files.com/646b351987a8d8ce158d1940/64ec9e96b4334c0e1ac41504_Logo%20with%20white%20text.svg"
base_model: prometheus-eval/prometheus-7b-v2.0
metrics:
- memory_disk
- memory_inference
- inference_latency
- inference_throughput
- inference_CO2_emissions
- inference_energy_consumption
tags:
- pruna-ai
---
<!-- header start -->
<!-- 200823 -->
<div style="width: auto; margin-left: auto; margin-right: auto">
    <a href="https://www.pruna.ai/" target="_blank" rel="noopener noreferrer">
        <img src="https://i.imgur.com/eDAlcgk.png" alt="PrunaAI" style="width: 100%; min-width: 400px; display: block; margin: auto;">
    </a>
</div>
<!-- header end -->

[![Twitter](https://img.shields.io/twitter/follow/PrunaAI?style=social)](https://twitter.com/PrunaAI)
[![GitHub](https://img.shields.io/github/followers/PrunaAI?label=Follow%20%40PrunaAI&style=social)](https://github.com/PrunaAI)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue)](https://www.linkedin.com/company/93832878/admin/feed/posts/?feedType=following)
[![Discord](https://img.shields.io/badge/Discord-Join%20Us-blue?style=social&logo=discord)](https://discord.gg/rskEr4BZJx)

# Simply make AI models cheaper, smaller, faster, and greener!

- Give a thumbs up if you like this model!
- Contact us and tell us which model to compress next [here](https://www.pruna.ai/contact).
- Request access to easily compress your *own* AI models [here](https://z0halsaff74.typeform.com/pruna-access?typeform-source=www.pruna.ai).
- Read the documentations to know more [here](https://pruna-ai-pruna.readthedocs-hosted.com/en/latest/)
- Join Pruna AI community on Discord [here](https://discord.gg/CP4VSgck) to share feedback/suggestions or get help.

## Results

![image info](./plots.png)

**Frequently Asked Questions**
- ***How does the compression work?*** The model is compressed with hqq.
- ***How does the model quality change?*** The quality of the model output might vary compared to the base model.
- ***How is the model efficiency evaluated?*** These results were obtained on HARDWARE_NAME with configuration described in `model/smash_config.json` and are obtained after a hardware warmup. The smashed model is directly compared to the original base model. Efficiency results may vary in other settings (e.g. other hardware, image size, batch size, ...). We recommend to directly run them in the use-case conditions to know if the smashed model can benefit you.
- ***What is the model format?*** We use safetensors.
- ***What calibration data has been used?*** If needed by the compression method, we used WikiText as the calibration data.
- ***What is the naming convention for Pruna Huggingface models?*** We take the original model name and append "turbo", "tiny", or "green" if the smashed model has a measured inference speed, inference memory, or inference energy consumption which is less than 90% of the original base model.
- ***How to compress my own models?*** You can request premium access to more compression methods and tech support for your specific use-cases [here](https://z0halsaff74.typeform.com/pruna-access?typeform-source=www.pruna.ai).
- ***What are "first" metrics?*** Results mentioning "first" are obtained after the first run of the model. The first run might take more memory or be slower than the subsequent runs due cuda overheads.
- ***What are "Sync" and "Async" metrics?*** "Sync" metrics are obtained by syncing all GPU processes and stop measurement when all of them are executed. "Async" metrics are obtained without syncing all GPU processes and stop when the model output can be used by the CPU. We provide both metrics since both could be relevant depending on the use-case. We recommend to test the efficiency gains directly in your use-cases.

## Setup

You can run the smashed model with these steps:

0. Check requirements from the original repo prometheus-eval/prometheus-7b-v2.0 installed. In particular, check python, cuda, and transformers versions.
1. Make sure that you have installed quantization related packages.
    ```bash
    pip install hqq
    ```
2. Load & run the model.
    ```python 
   from transformers import AutoModelForCausalLM, AutoTokenizer
    from hqq.engine.hf import HQQModelForCausalLM
 from hqq.models.hf.base import AutoHQQHFModel

   try:
     model = HQQModelForCausalLM.from_quantized("PrunaAI/prometheus-eval-prometheus-7b-v2.0-HQQ-1bit-smashed", device_map='auto')
    except: 
     model = AutoHQQHFModel.from_quantized("PrunaAI/prometheus-eval-prometheus-7b-v2.0-HQQ-1bit-smashed")
   tokenizer = AutoTokenizer.from_pretrained("prometheus-eval/prometheus-7b-v2.0")
    
   input_ids = tokenizer("What is the color of prunes?,", return_tensors='pt').to(model.device)["input_ids"]
    
   outputs = model.generate(input_ids, max_new_tokens=216)
   tokenizer.decode(outputs[0])
    ```

## Configurations

The configuration info are in `smash_config.json`.

## Credits & License

The license of the smashed model follows the license of the original model. Please check the license of the original model prometheus-eval/prometheus-7b-v2.0 before using this model which provided the base model. The license  of the `pruna-engine` is [here](https://pypi.org/project/pruna-engine/) on Pypi.

## Want to compress other models?

- Contact us and tell us which model to compress next [here](https://www.pruna.ai/contact).
- Request access to easily compress your own AI models [here](https://z0halsaff74.typeform.com/pruna-access?typeform-source=www.pruna.ai).