#! /usr/bin/env python3
from __future__ import print_function

import argparse

from google import protobuf
from src.calibration.lib_calibration.calibration_pb2 import VehicleCalibrationProto



def main():
    parser = argparse.ArgumentParser(
        description='Generate a calibration scene visualization from a vehicle calibration file')
    parser.add_argument('pbcal_file', default='', metavar='FILENAME.pbcal',
                        help='The vehicle calibration that is to be visualized')
    parser.add_argument('--avs-root', default='/home/lyft/avsoftware',
                        help='Root directory of your `lyft/avsoftware` repository. Protobuf '
                             'schema are read from under this folder.')
    args = parser.parse_args()

    def pose_to_matrix(pose):
        r, t = pose.rotation, pose.translation
        return [
            list(r.row_1) + [ t.x ],
            list(r.row_2) + [ t.y ],
            list(r.row_3) + [ t.z ],
            [0., 0., 0., 1.]
        ]


    with open(args.pbcal_file, 'rb') as f:
        vehicle_calib = VehicleCalibrationProto()
        vehicle_calib.ParseFromString(f.read())

        from itertools import chain
        sensors = chain(vehicle_calib.cameras, vehicle_calib.lidars, vehicle_calib.radars)
        for s in sensors:
            print('FRAME {}'.format(s.id))
            print('    description: {}'.format(s.description))
            print('    transform.matrix:', pose_to_matrix(s.pose))
            print('')

if __name__ == "__main__":
    main()
