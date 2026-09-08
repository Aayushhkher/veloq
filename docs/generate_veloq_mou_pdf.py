#!/usr/bin/env python3
"""Generate VeLoQ MOU PDF between Forteva Tech and Debtanay Mishra."""

from fpdf import FPDF
from pathlib import Path

OUTPUT = Path(__file__).resolve().parent / "MOU_VeLoQ_FortevaTech_DebtanayMishra.pdf"


class MOUPDF(FPDF):
    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(100, 100, 100)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")


def section_title(pdf: MOUPDF, title: str):
    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(20, 40, 80)
    pdf.multi_cell(0, 6, title)
    pdf.set_text_color(0, 0, 0)
    pdf.ln(1)


def body(pdf: MOUPDF, text: str):
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(0, 5.2, text)
    pdf.ln(1.5)


def bullet(pdf: MOUPDF, text: str):
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(0, 5.2, f"  -  {text}")
    pdf.ln(0.8)


def build_pdf():
    pdf = MOUPDF()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "MEMORANDUM OF UNDERSTANDING", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "VeLoQ Website Development & Maintenance", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, "Between Forteva Tech and Mr. Debtanay Mishra", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)

    meta = [
        ("Document Reference:", "FT-VLQ-MOU-2026-001"),
        ("Effective Date:", "___________________________"),
        ("Place of Execution:", "___________________________"),
    ]
    pdf.set_font("Helvetica", "", 9)
    for label, value in meta:
        pdf.cell(45, 5, label)
        pdf.cell(0, 5, value, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    section_title(pdf, "PARTIES")
    body(
        pdf,
        'This Memorandum of Understanding ("MOU") is entered into on the Effective Date '
        "set forth above by and between:",
    )
    body(
        pdf,
        "Forteva Tech, represented by its Founder Mr. Aayush Kher "
        '(hereinafter "Forteva Tech" or "Developer"); and',
    )
    body(
        pdf,
        'Mr. Debtanay Mishra (hereinafter "Client").',
    )
    body(
        pdf,
        'Forteva Tech and the Client are together referred to as the "Parties."',
    )

    section_title(pdf, "BACKGROUND")
    body(
        pdf,
        "The Client engaged Forteva Tech to design and develop a full-stack survey marketplace "
        'web application called "VeLoQ".',
    )
    body(
        pdf,
        "Forteva Tech has completed the VeLoQ website for the Client at an agreed fee of "
        "INR 4,000 (Indian Rupees Four Thousand Only).",
    )
    body(
        pdf,
        "The Client confirms that the full payment of INR 4,000 has already been received by "
        "Forteva Tech. Forteva Tech acknowledges receipt of this amount in full and final "
        "settlement of the development fee.",
    )
    body(
        pdf,
        "The Client will receive complete ownership of the project code and materials. Forteva Tech "
        "will continue to support the website through ongoing maintenance at a minimal cost, "
        "as described below.",
    )

    section_title(pdf, "DEFINITIONS")
    bullet(pdf, '"VeLoQ Website" means the complete web application delivered under this MOU, including frontend, backend, database setup, configuration files, and deployment documentation handed over to the Client.')
    bullet(pdf, '"Deliverables" means all source code, documentation, environment templates, Docker/deployment files, and assets created for the VeLoQ project.')
    bullet(pdf, '"Handover" means transfer of repository access, deployment instructions, and a reasonable walkthrough so the Client can run and manage the system.')
    bullet(pdf, '"Maintenance Services" means bug fixes, security updates, dependency updates, and minor operational support as described under Maintenance Services below.')

    section_title(pdf, "SCOPE OF WORK")
    body(
        pdf,
        "Forteva Tech has developed for the Client a full-stack platform including:",
    )
    bullet(pdf, "Next.js frontend (user, company, and admin interfaces)")
    bullet(pdf, "FastAPI backend with REST API and authentication")
    bullet(pdf, "PostgreSQL database integration")
    bullet(pdf, "Redis caching and Celery background workers")
    bullet(pdf, "Configuration for Google OAuth and Razorpay payments")
    bullet(pdf, "Docker-based setup for local and production deployment")
    body(
        pdf,
        "This MOU covers the VeLoQ website as delivered. Any new features, mobile app, major "
        "redesign, or large functional changes will need a separate agreement and quotation.",
    )

    section_title(pdf, "DELIVERABLES AND HANDOVER")
    body(
        pdf,
        "Since full payment has been received, Forteva Tech will hand over to the Client:",
    )
    bullet(pdf, "Complete source code (frontend, backend, and related files)")
    bullet(pdf, "Environment templates and deployment guide")
    bullet(pdf, "Database seed/migration scripts where applicable")
    bullet(pdf, "Basic documentation to run the app locally and on a server")
    bullet(pdf, "One remote handover session (about 60 minutes) to explain setup and admin use")
    body(
        pdf,
        "Handover is complete when the Client has repository access and confirms receipt "
        "(email confirmation is fine).",
    )

    section_title(pdf, "PAYMENT")
    body(
        pdf,
        "The total fee for developing and delivering the VeLoQ Website is INR 4,000 "
        "(Indian Rupees Four Thousand Only).",
    )
    body(
        pdf,
        "The Client confirms that this entire amount has already been paid to Forteva Tech. "
        "Forteva Tech confirms that it has received the full payment of INR 4,000 and has "
        "no further claim for development charges under this MOU.",
    )
    body(
        pdf,
        "Ongoing maintenance support is separate from this INR 4,000 fee and will be charged "
        "at minimal maintenance rates as agreed from time to time.",
    )

    section_title(pdf, "OWNERSHIP OF CODE")
    body(
        pdf,
        "Forteva Tech hereby transfers to the Client full ownership of all custom source code "
        "and project materials created for VeLoQ, including copyright in the work product "
        "delivered for this project.",
    )
    body(
        pdf,
        "The Client has complete ownership of the VeLoQ source code and may use, change, host, "
        "or sell the application as they wish, without further payment to Forteva Tech. "
        "Open-source libraries used in the project (such as Next.js, FastAPI, etc.) remain "
        "under their own licences.",
    )
    body(
        pdf,
        "After handover, Forteva Tech does not claim ownership of the VeLoQ code delivered "
        "to the Client. Forteva Tech may show this project in its portfolio unless the "
        "Client asks in writing not to do so.",
    )
    body(
        pdf,
        "The Client is responsible for their own accounts with Google, Razorpay, hosting, "
        "domain, and other third-party services.",
    )

    section_title(pdf, "MAINTENANCE SERVICES")
    body(
        pdf,
        "Forteva Tech agrees to provide ongoing maintenance for the VeLoQ Website after handover, "
        "at a minimal maintenance cost to be agreed between the Parties before any paid work starts.",
    )
    body(
        pdf,
        '"Minimal maintenance cost" means reasonable, low rates offered by Forteva Tech to '
        "the Client as a goodwill arrangement.",
    )
    body(
        pdf,
        "Maintenance typically includes:",
    )
    bullet(pdf, "Important bug fixes (login, surveys, payments, etc.)")
    bullet(pdf, "Security and dependency updates where reasonably possible")
    bullet(pdf, "Help with deployment issues related to the delivered code")
    bullet(pdf, "Small configuration help (env files, Docker, restarts)")
    body(
        pdf,
        "Maintenance does not include:",
    )
    bullet(pdf, "New features or major redesigns")
    bullet(pdf, "Problems caused by changes made by the Client or wrong hosting setup")
    bullet(pdf, "Outages of Google, Razorpay, or other third-party services")
    bullet(pdf, "Data recovery if the Client has not kept backups")
    body(
        pdf,
        "Forteva Tech will try to respond to maintenance requests within 3 to 5 working days.",
    )
    body(
        pdf,
        "Either Party may stop the maintenance arrangement with 15 days written notice. "
        "Stopping maintenance does not affect the Client's ownership of the code.",
    )

    section_title(pdf, "WARRANTIES")
    body(
        pdf,
        "Forteva Tech confirms that the VeLoQ code was built in a proper and professional manner. "
        "After handover, the website is provided on an \"as is\" basis for further use.",
    )
    body(
        pdf,
        "The Client understands that live operation depends on correct setup of hosting, "
        "API keys, and third-party accounts managed by the Client.",
    )

    section_title(pdf, "CONFIDENTIALITY")
    body(
        pdf,
        "Both Parties agree to keep each other's private business and technical information "
        "confidential, unless required by law or already public.",
    )

    section_title(pdf, "LIABILITY")
    body(
        pdf,
        "Forteva Tech's total responsibility under this MOU is limited to the INR 4,000 "
        "development fee already received, except in case of deliberate wrongdoing.",
    )
    body(
        pdf,
        "Neither Party is responsible for indirect losses such as lost profits or lost data, "
        "where permitted.",
    )

    section_title(pdf, "TERM")
    body(
        pdf,
        "This MOU is effective from the Effective Date. Development and payment obligations "
        "are already fulfilled. Handover and ownership transfer apply as stated above.",
    )
    body(
        pdf,
        "Maintenance continues only while both Parties agree to continue it.",
    )

    section_title(pdf, "GENERAL")
    bullet(pdf, "This MOU is the full understanding between the Parties for VeLoQ development, payment received, ownership, and maintenance.")
    bullet(pdf, "Any changes must be agreed in writing and signed by both Parties.")
    bullet(pdf, "Notices may be sent by email or post to the addresses in the signature section.")

    section_title(pdf, "SIGNATURES")
    body(
        pdf,
        "Both Parties sign this MOU on the Effective Date mentioned above.",
    )
    pdf.ln(6)

    y_start = pdf.get_y()
    col_w = 90

    pdf.set_font("Helvetica", "B", 10)
    pdf.set_xy(10, y_start)
    pdf.multi_cell(col_w, 5, "FOR FORTEVA TECH\n(Developer)")
    pdf.set_font("Helvetica", "", 10)
    pdf.set_x(10)
    pdf.multi_cell(
        col_w,
        5,
        "Name: Aayush Kher\nDesignation: Founder, Forteva Tech\n\n"
        "Signature: _______________________\n\nDate: _______________________\n\n"
        "Address: _______________________\n\nEmail: _______________________\n"
        "Phone: _______________________",
    )

    pdf.set_font("Helvetica", "B", 10)
    pdf.set_xy(110, y_start)
    pdf.multi_cell(col_w, 5, "FOR THE CLIENT")
    pdf.set_font("Helvetica", "", 10)
    pdf.set_xy(110, y_start + 10)
    pdf.multi_cell(
        col_w,
        5,
        "Name: Debtanay Mishra\n\nSignature: _______________________\n\n"
        "Date: _______________________\n\nAddress: _______________________\n\n"
        "Email: _______________________\nPhone: _______________________",
    )

    pdf.output(OUTPUT)
    return OUTPUT


if __name__ == "__main__":
    path = build_pdf()
    print(f"Generated: {path}")
