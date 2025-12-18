from fpdf import FPDF
from datetime import datetime


class TuitionBill(FPDF):
    def header(self):
        # University Logo/Name Area
        self.set_font('Arial', 'B', 20)
        self.set_text_color(44, 62, 80)  # Dark Blue
        self.cell(0, 10, 'STATE UNIVERSITY', 0, 1, 'L')
        self.set_font('Arial', '', 10)
        self.cell(0, 5, "Bursar's Office | 123 University Ave, College Town, ST 12345", 0, 1, 'L')
        self.cell(0, 5, 'bursar@state.edu | (555) 123-4567', 0, 1, 'L')
        self.ln(10)
        
        # Title
        self.set_font('Arial', 'B', 16)
        self.set_text_color(0, 0, 0)
        self.cell(0, 10, 'TUITION BILL / STATEMENT OF ACCOUNT', 0, 1, 'C')
        self.ln(5)


    def footer(self):
        self.set_y(-30)
        self.set_font('Arial', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 5, 'Payment Instructions: Make checks payable to State University.', 0, 1, 'C')
        self.cell(0, 5, 'Include Student ID on all correspondence.', 0, 1, 'C')
        self.cell(0, 5, f'Page {self.page_no()}', 0, 0, 'C')


def create_bill():
    pdf = TuitionBill()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)


    # --- Invoice Details Section ---
    pdf.set_fill_color(240, 240, 240)
    pdf.rect(10, 55, 190, 35, 'F')
    
    pdf.set_font('Arial', 'B', 10)
    pdf.set_xy(15, 60)
    pdf.cell(90, 5, 'BILLING INFORMATION:', 0, 0)
    pdf.set_xy(110, 60)
    pdf.cell(90, 5, 'INVOICE DETAILS:', 0, 1)


    pdf.set_font('Arial', '', 10)
    
    # Student Info (Left Column)
    pdf.set_xy(15, 66)
    pdf.multi_cell(90, 5, 
        'Student Name: Jane Doe\n'
        'Student ID: 12345678\n'
        'Email: jane.doe@student.state.edu\n'
        'Address: 456 Dormitory Lane, Rm 101'
    )


    # Invoice Info (Right Column) - Format for better OCR extraction
    pdf.set_xy(110, 66)
    pdf.multi_cell(90, 5, 
        'Invoice ID: INV-2024-001234\n'
        'Invoice Date: November 20, 2024\n'
        'Billing Period: Fall 2024 Semester\n'
        'Due Date: 2024-12-20'
    )
    
    pdf.ln(15)


    # --- Charges Table ---
    # Header
    pdf.set_fill_color(44, 62, 80)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font('Arial', 'B', 11)
    pdf.cell(130, 10, 'Description', 1, 0, 'C', True)
    pdf.cell(60, 10, 'Amount', 1, 1, 'C', True)


    # Items
    pdf.set_text_color(0, 0, 0)
    pdf.set_font('Arial', '', 11)
    
    items = [
        ("Tuition - Fall 2024 (12 Credits)", "$3,500.00"),
        ("Student Activity Fee", "$300.00"),
        ("Technology Infrastructure Fee", "$100.00"),
        ("Health Services Fee", "$100.00"),
    ]


    for desc, amount in items:
        pdf.cell(130, 10, f'  {desc}', 1, 0, 'L')
        pdf.cell(60, 10, amount, 1, 1, 'R')


    # Total Row - Make it more prominent for extraction
    pdf.ln(5)
    pdf.set_font('Arial', 'B', 14)
    pdf.cell(130, 12, 'Invoice Total:', 0, 0, 'R')
    pdf.set_text_color(192, 57, 43)  # Red for urgency
    pdf.cell(60, 12, '$4,000.00', 1, 1, 'R')
    
    # Also add "TOTAL AMOUNT DUE" for fallback extraction
    pdf.ln(2)
    pdf.set_font('Arial', 'B', 12)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(130, 10, 'TOTAL AMOUNT DUE:', 0, 0, 'R')
    pdf.set_text_color(192, 57, 43)
    pdf.cell(60, 10, '$4,000.00', 0, 1, 'R')
    
    # --- Due Date Warning ---
    pdf.ln(10)
    pdf.set_text_color(0, 0, 0)
    pdf.set_fill_color(255, 240, 240)
    pdf.set_font('Arial', 'B', 12)
    pdf.cell(0, 15, '  DUE DATE: 2024-12-20', 1, 1, 'L', True)
    
    pdf.set_font('Arial', '', 10)
    pdf.multi_cell(0, 10, 
        'Please ensure payment is received by the due date to avoid a late fee of $50.00.\n'
        'Accepted payment methods: Credit Card (Visa/MC), eCheck, or Bank Transfer.'
    )


    # Save
    pdf.output("tuition_bill.pdf")
    print("Successfully created 'tuition_bill.pdf'")


if __name__ == '__main__':
    create_bill()

