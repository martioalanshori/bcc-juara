# Pemeriksaan tulis state di server.py: kasus bersama dengan guard.test.mjs (api/_guard.js).
# Jalankan: python -m unittest discover -s tools/tests -p "test_*.py"
import copy
import json
import os
import sys
import unittest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, ROOT)
import server  # noqa: E402  (impor tidak menjalankan server; main() hanya di __main__)

with open(os.path.join(os.path.dirname(__file__), "guard_cases.json"), encoding="utf-8") as f:
    C = json.load(f)


def build(over, is_null):
    if is_null:
        return None
    s = copy.deepcopy(C["base"])
    s.update(copy.deepcopy(over or {}))
    return s


class GuardCases(unittest.TestCase):
    def test_cases(self):
        for c in C["cases"]:
            with self.subTest(c["name"]):
                err = server.guard(build(c.get("old"), c.get("oldNull")), build(c.get("next"), c.get("nextNull")), c["roles"])
                if c["ok"]:
                    self.assertIsNone(err)
                else:
                    self.assertTrue(err)


if __name__ == "__main__":
    unittest.main()
