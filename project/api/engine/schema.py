"""Column mapping: lets the system work with any sales-type dataset.

The user (or the auto-detector) maps the columns of the uploaded file to the fields the system understands.
Only Sales and a date are required; every other field is optional, and the analyses that need a missing
field are switched off instead of failing.
"""
import difflib
import re
import warnings

import numpy as np
import pandas as pd


class MappingError(ValueError):
    """Raised when the column mapping is not usable."""


# canonical name -> description, kind, default for a missing column, synonyms (normalised: lower case, letters and digits only)
FIELDS = {
    "Sales": dict(desc="Sales amount or revenue per row", kind="num", req=True,
                  syn=["sales", "revenue", "totalsales", "salesamount", "amount", "netsales", "totalamount", "grossrevenue", "turnover", "sale", "totalrevenue", "salesvalue"]),
    "Sales Date": dict(desc="Date of the sale or transaction", kind="date", req=True,
                       syn=["salesdate", "date", "transactiondate", "invoicedate", "billdate", "purchasedate", "saledate", "timestamp", "datetime", "day", "invoicedatetime", "txndate", "transdate", "transactiondatetime", "dt"]),
    "Profit": dict(desc="Profit per row", kind="num", req=False, default=np.nan, syn=["profit", "netprofit", "grossprofit", "earnings", "income", "profits"]),
    "Quantity": dict(desc="Units sold", kind="num", req=False, default=1, syn=["quantity", "qty", "units", "unitssold", "orderquantity", "itemssold", "quantitysold"]),
    "Discount": dict(desc="Discount given (0 to 1, or in percent)", kind="num", req=False, default=0.0, syn=["discount", "discountrate", "discountpercent", "discountpct", "disc", "discountpercentage"]),
    "Order ID": dict(desc="Order or transaction id", kind="text", req=False, syn=["orderid", "ordernumber", "invoiceno", "invoicenumber", "transactionid", "billno", "receiptid", "orderno", "invoice"]),
    "Customer ID": dict(desc="Customer id", kind="text", req=False, syn=["customerid", "custid", "clientid", "userid", "customerno", "customercode", "buyerid", "customer"]),
    "Customer Name": dict(desc="Customer name (never shown in the dashboard)", kind="text", req=False, syn=["customername", "custname", "clientname"]),
    "Order Date": dict(desc="Date the order was placed", kind="date", req=False, syn=["orderdate", "orderdt", "orderplaceddate"]),
    "Ship Date": dict(desc="Date the order was shipped", kind="date", req=False, syn=["shipdate", "deliverydate", "shippingdate", "dispatchdate", "shippeddate"]),
    "Date of Birth": dict(desc="Customer date of birth (gives Age)", kind="date", req=False, syn=["dateofbirth", "dob", "birthdate", "birthday"]),
    "Category of Goods": dict(desc="Product category", kind="text", req=False, syn=["categoryofgoods", "category", "productcategory", "department", "itemcategory", "producttype", "maincategory"]),
    "Sub-Category": dict(desc="Product sub-category", kind="text", req=False, syn=["subcategory", "subcat", "productsubcategory", "itemsubcategory"]),
    "Region": dict(desc="Sales region", kind="text", req=False, syn=["region", "zone", "area", "territory", "salesregion"]),
    "State": dict(desc="State, province or city", kind="text", req=False, syn=["state", "province", "statename", "stateprovince", "city", "location"]),
    "Segment": dict(desc="Customer segment", kind="text", req=False, syn=["segment", "customersegment", "customertype", "customergroup"]),
    "Outlet Type": dict(desc="Store or outlet type", kind="text", req=False, syn=["outlettype", "storetype", "storeformat", "storesize", "branchtype", "saleschannel", "channel", "store", "storename", "storeid", "branch", "outlet", "shop"]),
    "City Type": dict(desc="City tier or type", kind="text", req=False, syn=["citytype", "citytier", "tier", "locationtype", "citycategory"]),
    "Ship Mode": dict(desc="Shipping or delivery mode", kind="text", req=False, syn=["shipmode", "shippingmode", "deliverymode", "shipmethod", "shippingmethod", "deliverymethod"]),
    "Product Name": dict(desc="Product name", kind="text", req=False, syn=["productname", "product", "itemname", "item", "productdescription", "description"]),
}
ORDER = ["Sales", "Profit", "Quantity", "Discount", "Sales Date", "Order Date", "Ship Date", "Date of Birth", "Order ID", "Customer ID", "Customer Name",
         "Category of Goods", "Sub-Category", "Region", "State", "Segment", "Outlet Type", "City Type", "Ship Mode", "Product Name"]
REQUIRED = [k for k, v in FIELDS.items() if v["req"]]
CAPS = {"profit": "Profit", "quantity": "Quantity", "discount": "Discount", "order_id": "Order ID", "customer_id": "Customer ID",
        "order_date": "Order Date", "ship_date": "Ship Date", "dob": "Date of Birth", "category": "Category of Goods",
        "subcategory": "Sub-Category", "region": "Region", "state": "State", "segment": "Segment", "outlet": "Outlet Type",
        "city": "City Type", "ship_mode": "Ship Mode"}
FULL_CAPS = {k: True for k in CAPS}


def norm(s):
    return re.sub(r"[^a-z0-9]", "", str(s).lower())


def _numeric(series):
    if series.dtype == object or str(series.dtype).startswith(("str", "string")):
        series = series.astype(str).str.replace(r"[^0-9.\-]", "", regex=True).replace("", np.nan)
    return pd.to_numeric(series, errors="coerce")


def _dates(series):
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        d1 = pd.to_datetime(series, errors="coerce")
        if d1.isna().mean() > 0.05:
            d2 = pd.to_datetime(series, errors="coerce", dayfirst=True)
            if d2.isna().sum() < d1.isna().sum():
                return d2
    return d1


def _looks(kind, s):
    if kind == "num":
        return _numeric(s).notna().mean() >= 0.7
    if kind == "date":
        if pd.api.types.is_numeric_dtype(s):
            return False
        return _dates(s).notna().mean() >= 0.7
    return True


def suggest_mapping(sample):
    """Return {field: source column or None}, guessed from column names and a check of the values."""
    cols = list(sample.columns)
    used, out = set(), {}
    for f in ORDER:
        spec, hit = FIELDS[f], None
        cands = [c for c in cols if c not in used]
        names = {c: norm(c) for c in cands}
        keys = [norm(f)] + spec["syn"]
        for k in keys:                                         # exact match on name or synonym
            hit = next((c for c in cands if names[c] == k and _looks(spec["kind"], sample[c])), None)
            if hit:
                break
        if not hit:                                            # close spelling
            for c in cands:
                if difflib.get_close_matches(names[c], keys, n=1, cutoff=0.88) and _looks(spec["kind"], sample[c]):
                    hit = c
                    break
        out[f] = hit
        if hit:
            used.add(hit)
    if not out["Sales Date"] and out["Order Date"]:             # one date column is enough
        out["Sales Date"] = out["Order Date"]
    if not out["Sales Date"]:                                   # otherwise take the first column that holds dates
        out["Sales Date"] = next((c for c in cols if c not in used and _looks("date", sample[c])), None)
    return out


def apply_mapping(raw, mapping):
    """Return (standard_df, caps, notes). Missing optional fields get neutral defaults and are listed in the notes."""
    mapping = {k: v for k, v in mapping.items() if v}
    missing = [f for f in REQUIRED if f not in mapping]
    if missing:
        raise MappingError("Please map the required fields: " + ", ".join(missing) + ".")
    for f, c in mapping.items():
        if c not in raw.columns:
            raise MappingError(f"Column '{c}' (mapped to {f}) is not in the file.")
    out, notes = raw.copy(), []
    for f, c in mapping.items():
        if f in out.columns and f != c:
            out = out.rename(columns={f: f"{f} (original)"})
        out[f] = raw[c].values
    # types
    for f, spec in FIELDS.items():
        if f not in mapping:
            continue
        if spec["kind"] == "num":
            out[f] = _numeric(out[f])
            if f in REQUIRED and out[f].notna().mean() < 0.5:
                raise MappingError(f"Column '{mapping[f]}' mapped to {f} does not look numeric ({100 * out[f].notna().mean():.0f}% valid values).")
        elif spec["kind"] == "date":
            out[f] = _dates(out[f])
            if f in REQUIRED and out[f].notna().mean() < 0.5:
                raise MappingError(f"Column '{mapping[f]}' mapped to {f} does not look like a date ({100 * out[f].notna().mean():.0f}% valid dates).")
        else:
            out[f] = out[f].astype(str).where(out[f].notna(), "Unknown")
    if "Discount" in mapping:
        mx = out["Discount"].max()
        if pd.notna(mx) and 1 < mx <= 100:
            out["Discount"] = out["Discount"] / 100
            notes.append("Discount looked like percent values (above 1), so it was divided by 100.")
    # defaults for fields that are not in the file
    caps = {k: f in mapping for k, f in CAPS.items()}
    unknown_text = []
    for f, spec in FIELDS.items():
        if f in mapping or f in REQUIRED:
            continue
        if f == "Order Date":
            out[f] = out["Sales Date"]
            notes.append("No Order Date: Sales Date is used.")
        elif f == "Ship Date":
            out[f] = out["Order Date"]
            notes.append("No Ship Date: shipping time is not analysed.")
        elif f == "Date of Birth":
            out[f] = pd.NaT
            notes.append("No Date of Birth: customer age is not available.")
        elif f in ("Order ID", "Customer ID"):
            out[f] = [f"R{i + 1}" for i in range(len(out))]
            notes.append(f"No {f}: a unique id was created for every row" + (" (each row is treated as a separate customer)." if f == "Customer ID" else "."))
        elif f == "Customer Name":
            out[f] = ""
        elif spec["kind"] == "text":
            out[f] = "Unknown"
            unknown_text.append(f)
        else:
            out[f] = spec["default"]
            if f == "Profit":
                notes.append("No Profit column: profit KPIs, profit prediction and margin analysis are switched off.")
            elif f == "Quantity":
                notes.append("No Quantity: each row counts as 1 unit.")
            elif f == "Discount":
                notes.append("No Discount: discount analysis is skipped.")
    if unknown_text:
        notes.append("Not in the file, so analyses by these are skipped: " + ", ".join(unknown_text) + ".")
    return out, caps, notes


def peek(file_bytes, filename, nrows=500):
    """Read the first rows of an uploaded file (for the column-mapping screen)."""
    import io
    name = str(filename).lower()
    if name.endswith((".xlsx", ".xls")):
        return pd.read_excel(io.BytesIO(file_bytes), nrows=nrows)
    for enc in ("utf-8", "utf-8-sig", "latin1"):
        try:
            return pd.read_csv(io.BytesIO(file_bytes), nrows=nrows, encoding=enc, sep=None, engine="python")
        except (UnicodeDecodeError, pd.errors.ParserError):
            continue
    raise ValueError("The file could not be read. Please upload a CSV or Excel file.")
