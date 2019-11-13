#! /usr/bin/env python3
""" Generate python protobuf classes for specific avsoftware proto
messages.

Example
-------
```
python3 _generate_avs_py_protoclasses.py --verbose avsoftware.avs.GUID
```
"""
from __future__ import print_function

import sys
import os
import re
import argparse



def _create_python_packages(root, paths):
    """ Create `__init__.py` files recursively so that the generated
    protobuf bindings can be imported.
    """

    def ensure__init__py(folder):
        if os.path.exists(os.path.join(folder, '__init__.py')):
            return
        with open(os.path.join(folder, '__init__.py'), 'w') as f:
            f.write('\n')

    for path in paths:
        while path != root:
            ensure__init__py(path)
            path = os.path.dirname(path)


def _generate_protobuf_classes(msg_names, verbose=False):
    """Generate protobuf classes for the specified messages, inside the
    avsoftware git submodule.

    Parameters
    ----------
    msg_names: list
        Python bindings are generated for these messages.

    Notes
    -----
    The `protoc` compiler only generates python bindings in `.py` files;
    The generated files might not be accessible because the package
    hierarchy might not have the required `__init__.py`. To fix this,
    this function also creates `__init__.py` files in the output folder
    hierarchy as required.
    """
    this_file_dir = os.path.abspath(os.path.dirname(__file__))
    avs_root = os.path.abspath(this_file_dir + '/../deps/avsoftware/')
    out_path = avs_root

    def get_package_name(proto_file_contents):
        package_name = re.findall(r'\bpackage\s+([A-Za-z0-9_\.]+)\s*;', proto_file_contents)
        assert len(package_name) <= 1, "Multiple packages in .proto file: {} !!"
        return package_name[0] if package_name else None

    def prefix_package(package, msg):
        """ Fully qualified name for msg (package.msg) """
        return "{}.{}".format(package, msg) if package else msg

    def contained_proto_messages(proto_file):
        with open(proto_file) as f:
            contents = f.read()
            package_name = get_package_name(contents)
            msgs = re.finditer(r'\bmessage\s+(\w+)\s*\{', contents)
            return [ prefix_package(package_name, m.groups(0)[0]) for m in msgs ]

    proto_def_files = dict()
    proto_def_paths = set()
    msg_def_files = {}
    for parent, _dirs, files in os.walk(avs_root):
        for f in files:
            if f.endswith('.proto'):
                file_path = os.path.join(parent, f)
                file_stem = os.path.splitext(os.path.basename(f))[0]
                msg_def_files.update(**{m:file_path for m in contained_proto_messages(file_path)})
                proto_def_files[file_stem] = file_path
                proto_def_paths.add(parent)

    import subprocess
    cmd = [ 'protoc', '-I' + avs_root, '--python_out={}'.format(out_path) ]

    for m in msg_names:
        if m not in msg_def_files:
            print("  ERROR: Could not find definition for `{}`; "
                  "Are you using the full package qualified name?".format(m), file=sys.stderr)
            sys.exit(-1)

    cmd += [ msg_def_files[m] for m in msg_names ]
    if verbose:
        print('  ' + ' \\\n    '.join(cmd))

    subprocess.check_call(cmd)
    _create_python_packages(avs_root, [ os.path.dirname(msg_def_files[m]) for m in msg_names ])


def main():
    parser = argparse.ArgumentParser(
        description='Generate a calibration scene visualization from a vehicle calibration file')
    parser.add_argument('-v', '--verbose', action='store_true')
    parser.add_argument('message_names', nargs='*',
                        help='Message names to generate class definitions for.')
    args = parser.parse_args()

    _generate_protobuf_classes(args.message_names, args.verbose)

if __name__ == "__main__":
    main()
