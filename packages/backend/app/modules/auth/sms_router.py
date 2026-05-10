"""Route an OTP SMS to the right provider based on the recipient's country code.

- African numbers → Africa's Talking (CEMAC/West/East/Southern Africa coverage,
  better delivery + significantly cheaper per-message).
- Everything else → Twilio (global coverage).

E.164 dialing prefixes assigned by ITU to African countries: 20, 27, and 21x-29x
(with a few non-African codes mixed into 29x — explicitly excluded below).
"""

from app.modules.auth.africastalking import send_sms as _send_via_at
from app.modules.auth.twilio import send_sms as _send_via_twilio

# Sub-Saharan, North, and Indian Ocean African nations + dependencies AT delivers to.
# Updated against ITU Recommendation E.164 / national-prefix assignments.
_AFRICAN_COUNTRY_CODES: frozenset[str] = frozenset(
    {
        # 2-digit
        "20",  # Egypt
        "27",  # South Africa
        # 21x — North Africa
        "211",  # South Sudan
        "212",  # Morocco
        "213",  # Algeria
        "216",  # Tunisia
        "218",  # Libya
        # 22x
        "220",  # Gambia
        "221",  # Senegal
        "222",  # Mauritania
        "223",  # Mali
        "224",  # Guinea
        "225",  # Côte d'Ivoire
        "226",  # Burkina Faso
        "227",  # Niger
        "228",  # Togo
        "229",  # Benin
        # 23x
        "230",  # Mauritius
        "231",  # Liberia
        "232",  # Sierra Leone
        "233",  # Ghana
        "234",  # Nigeria
        "235",  # Chad
        "236",  # Central African Republic
        "237",  # Cameroon
        "238",  # Cape Verde
        "239",  # São Tomé & Príncipe
        # 24x
        "240",  # Equatorial Guinea
        "241",  # Gabon
        "242",  # Republic of the Congo
        "243",  # DR Congo
        "244",  # Angola
        "245",  # Guinea-Bissau
        "246",  # British Indian Ocean Territory (Diego Garcia)
        "247",  # Ascension Island
        "248",  # Seychelles
        "249",  # Sudan
        # 25x
        "250",  # Rwanda
        "251",  # Ethiopia
        "252",  # Somalia
        "253",  # Djibouti
        "254",  # Kenya
        "255",  # Tanzania
        "256",  # Uganda
        "257",  # Burundi
        "258",  # Mozambique
        # 26x
        "260",  # Zambia
        "261",  # Madagascar
        "262",  # Réunion / Mayotte (French overseas; Indian Ocean African region)
        "263",  # Zimbabwe
        "264",  # Namibia
        "265",  # Malawi
        "266",  # Lesotho
        "267",  # Botswana
        "268",  # Eswatini
        "269",  # Comoros
        # 29x — only the African ones; explicitly skip Aruba (297), Faroe (298), Greenland (299)
        "290",  # Saint Helena, Ascension, Tristan da Cunha
        "291",  # Eritrea
    }
)


def is_african_number(phone: str) -> bool:
    """True if the E.164 number's country code is in Africa's Talking's footprint.

    Returns False for any string not starting with '+' or whose prefix doesn't match.
    """
    if not phone.startswith("+"):
        return False
    digits = phone[1:]
    return digits[:3] in _AFRICAN_COUNTRY_CODES or digits[:2] in _AFRICAN_COUNTRY_CODES


async def send_otp(*, to: str, message: str) -> None:
    """Pick the right provider and forward the OTP message."""
    if is_african_number(to):
        await _send_via_at(to=to, message=message)
    else:
        await _send_via_twilio(to=to, message=message)
