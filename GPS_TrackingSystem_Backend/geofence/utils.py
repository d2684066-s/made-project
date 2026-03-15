def is_inside_kendujhar(lat, lng):
    from .kendujhar_zone import KENDUJHAR_BOUNDARY
    return (
        KENDUJHAR_BOUNDARY["south"] <= lat <= KENDUJHAR_BOUNDARY["north"]
        and KENDUJHAR_BOUNDARY["west"] <= lng <= KENDUJHAR_BOUNDARY["east"]
    )