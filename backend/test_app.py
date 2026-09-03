import importlib.util
import unittest


spec = importlib.util.spec_from_file_location('obsidian_backend', 'app.py')
backend = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backend)


class AppConfigurationTests(unittest.TestCase):
    def test_llm_is_only_configured_for_existing_model_files(self):
        original_state = backend.LLM_ENABLED
        backend.LLM_ENABLED = True
        try:
            self.assertFalse(backend.is_llm_configured(''))
            self.assertFalse(backend.is_llm_configured('C:/definitely/missing.gguf'))

            with open('test_model.gguf', 'wb') as handle:
                handle.write(b'gguf')
            self.assertTrue(backend.is_llm_configured('test_model.gguf'))
            __import__('os').remove('test_model.gguf')
        finally:
            backend.LLM_ENABLED = original_state


if __name__ == '__main__':
    unittest.main()
