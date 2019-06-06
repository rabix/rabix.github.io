# CWL Patterns
_Tips for Using the Common Workflow Language_

This page contains some common patterns that are found when
describing tools and workflows in CWL. It is meant for users
who are currently writing CWL and need to quickly look up a 
practical pattern. 

The patterns are not in any particular order, and the webpage is
meant to be searched using the browser's find function.

If you want to add something to the list, or you find an error
please open an [issue](https://github.com/rabix/rabix.github.io/issues)
or create a [pull request](https://github.com/rabix/rabix.github.io/pulls) with fixes.

_For a systematic and gentle introduction to CWL please see
the [CWL user guide](https://www.commonwl.org/user_guide/)
which is a good resource for a self-paced
introduction to CWL._

_Biostars is a good source of help on CWL via the
[CWL tag](https://www.biostars.org/t/cwl/)._

<hr>

**Q: My program performs joint processing on a batch of multiple files. I used to pass each file name on the command line, but when I scale up I run into unix "Argument list too long" errors. What can I do?**

A: The most resilient solution is to alter the program to accept a manifest file. Most programs allow file names to be passed, one to a line, in an input text file. You can then use javascript and an `InitialWorkDirRequirement` to create this manifest file on the fly from the a File list input as follows:

```yml
class: CommandLineTool
cwlVersion: v1.0

inputs:
  input: 'File[]?'

baseCommand: cat
arguments: [manifest.txt]

requirements:
  - class: DockerRequirement
    dockerPull: alpine
  - class: InitialWorkDirRequirement
    listing:
      - entryname: manifest.txt
        entry: |-
          ${
              var x = ""
              for (var i = 0; i < inputs.input.length; i++)  
              { 
                  x += inputs.input[i].path + "\n"; 
              }
              return x;
          }
        writable: false
  - class: InlineJavascriptRequirement

outputs:
  output: stdout

stdout: out.txt
```

**Q: I have a Python script that I want to embed in my tool wrapper (not make part of the docker image). How would I do this?**

A: You can embed the script as an `InitialWorkDirRequirement`

```yaml
class: CommandLineTool
cwlVersion: v1.0

inputs:
  message: string

baseCommand: ["python", "myscript.py"]

requirements:
  InitialWorkDirRequirement:
    listing:
      - entryname: myscript.py
        entry: |-
          print("$(inputs.message)") 

outputs:
  example_out:
    type: stdout
stdout: output.txt
```

**Followup Q: My embedded (Bash/Python/R) script has `$` signs in it and this is conflicting with CWL parameter references. How do get them to play nicely together?**

A: You can escape the `$` in your script with `\$`

**Followup Q: I'd rather just paste the script into the CWL and not have to go through it, escaping the "$" signs. Do I have another option?**

A: You could embed your script in the "contents" field of the default value of a file as follows:

```yaml
#!/usr/bin/env cwl-runner
cwlVersion: v1.0
class: CommandLineTool
label: Run an embedded Python script
hints:
  DockerRequirement:
    dockerPull: python:3
baseCommand: python

inputs: 
  script: 
    type: File
    inputBinding:
      position: 1
    default:
        class: File
        basename: "script.py"
        contents: |-
          cash = 256.75
          print("This costs ${}".format(cash))

outputs:
  results:
    type: stdout
```

To note in this solution is that a user can supply a different file to the `script` input and override the default script. This can be considered a bug or a feature, depending on your use case.

**Q: I have a large file which I want to index. My indexing tool insists on creating the index in the same location as the file. I don't want to copy the file into my working directory, and, of course, I don't have write access to the original file.**

A: It is best to stage the input file using `InitialWorkDirRequirement`

```yaml
cwlVersion: v1.0
class: CommandLineTool
baseCommand: cat

inputs:
  input_file:
    type: File
    inputBinding:
      position: 1
      valueFrom: $(self.basename)

requirements:
  InitialWorkDirRequirement:
    listing:
      - $(inputs.in1)

outputs:
  out1: stdout

hints:
  DockerRequirement:
    dockerPull: alpine
```

**Q: I have one input which can be (1) an array of files, (2) nothing at all, (3) an array of null. How do I write my input to accommodate this?**

A: The closest is probably:

```yaml
my_input:
  type:
    - type: array
      items: ["null", File]
    - "null"
```

which will allow nothing at all and a list containing both Files and/or nulls.

**Q: I have a tool --- like say `samtools` or `vcf-sort` --- that writes to `stdout`. What is a succinct CWL idiom for collecting data written to stdout into a file? In bash one would do `vcf-sort -c in.vcf > out.vcf`.**

A: Use:

```yaml
outputs: 
  out: stdout

stdout: out.vcf
```

If you don't explicitly need a file `out.vcf` in that tool itself: you are just interested in the data, you can be even briefer:

```yaml
outputs: 
  out: stdout
```

**Q: I have a `File` input for my `CommandLineTool`. If the user does not supply a file, 
I would like to use a default file that I have stored in the docker image/have available on my file system**

A: You can supply a default `File` object

```yaml
class: CommandLineTool
cwlVersion: v1.0
inputs: 
  in1:
    type: File
    default: 
      class: File
      path: /path/to/my/file
    inputBinding:
      position: 1

baseCommand: cat

outputs:
  ou1: stdout

stdout: myfile.txt
```

**Q: Is there a way to return absolutely all outputs from the tool no matter what type they are?**

A: 

```yaml
my_output:
  type: Directory
  outputBinding: { glob: . }
```

Or

```yaml
my_output:
  type:
    type: array
    items: [Directory, File]
  outputBinding: {glob: "*"}
```
