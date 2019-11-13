all: update_protos

update_protos:
	python3 _generate_avs_py_protoclasses.py --verbose \
        avsoftware.avs.GUID \
        avsoftware.TimeProto \
        avsoftware.LyftCarTime \
        avsoftware.common.AABB3dProto \
        avsoftware.common.Vector3dProto \
        avsoftware.calibration.CalibrationSession \
        avsoftware.calibration.LidarSnapshotProto \
        avsoftware.calibration.VehicleCalibrationProto
