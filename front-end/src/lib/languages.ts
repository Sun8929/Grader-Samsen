export const LANGUAGES = [
  { id: 'c', label: 'C', template: '#include <stdio.h>\n\nint main() {\n    \n    return 0;\n}\n' },
  { id: 'cpp', label: 'C++', template: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n' },
  { id: 'js', label: 'JavaScript', template: 'const fs = require("fs");\nconst input = fs.readFileSync(0, "utf8").trim().split("\\n");\n' },
  { id: 'typescript', label: 'TypeScript', template: 'const fs = require("fs");\nconst input = fs.readFileSync(0, "utf8").trim().split("\\n");\n' },
  { id: 'python', label: 'Python', template: 'import sys\n\ndef main():\n    # code here\n    pass\n\nif __name__ == "__main__":\n    main()\n' },
  { id: 'java', label: 'Java', template: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        \n    }\n}\n' },
  { id: 'go', label: 'Go', template: 'package main\n\nimport "fmt"\n\nfunc main() {\n    \n}\n' },
  { id: 'rust', label: 'Rust', template: 'use std::io::{self, Read};\n\nfn main() {\n    let mut input = String::new();\n    io::stdin().read_to_string(&mut input).unwrap();\n    \n}\n' },
] as const
